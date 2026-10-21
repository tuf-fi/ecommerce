// Static accessibility checks for the patterns this app has actually broken before.
// Run: npm run check:a11y   (exits 1 on any finding)
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIRS = ["app", "components"];

function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (p.endsWith(".tsx")) out.push(p);
    }
    return out;
}

const findings = [];
const report = (file, line, rule, msg) => findings.push(`${path.relative(ROOT, file)}:${line}  [${rule}]  ${msg}`);
const lineOf = (src, idx) => src.slice(0, idx).split("\n").length;

// Index ranges covered by `.map( ... )` calls, found by matching parentheses.
function mapRanges(src) {
    const ranges = [];
    const re = /\.map\(/g;
    let m;
    while ((m = re.exec(src))) {
        let depth = 1;
        let i = m.index + m[0].length;
        while (i < src.length && depth > 0) {
            if (src[i] === "(") depth++;
            else if (src[i] === ")") depth--;
            i++;
        }
        ranges.push([m.index, i]);
    }
    return ranges;
}

for (const file of DIRS.flatMap((d) => walk(path.join(ROOT, d)))) {
    const src = fs.readFileSync(file, "utf8");
    const ranges = mapRanges(src);
    const inMap = (idx) => ranges.some(([a, b]) => idx > a && idx < b);

    // Literal ids and id references.
    const literalIds = new Map();
    const templateIdPrefixes = [];
    for (const m of src.matchAll(/\sid=(?:"([^"]+)"|\{"([^"]+)"\}|\{`([^`]*)`\})/g)) {
        const lit = m[1] ?? m[2];
        if (lit) {
            literalIds.set(lit, [...(literalIds.get(lit) ?? []), m.index]);
            if (inMap(m.index)) report(file, lineOf(src, m.index), "static-id-in-map", `id="${lit}" is inside a .map(); every row would share it. Build it from the row key.`);
        } else if (m[3]) templateIdPrefixes.push(m[3].split("${")[0]);
    }
    for (const [id, positions] of literalIds) {
        const outside = positions.filter((p) => !inMap(p));
        if (outside.length > 1) report(file, lineOf(src, outside[1]), "duplicate-id", `id="${id}" appears ${outside.length} times in this file.`);
    }

    // aria-describedby / aria-labelledby literals must point at an id rendered in the same file.
    for (const m of src.matchAll(/aria-(?:describedby|labelledby)=\{?([^\n]*?)\}?(?=\n|\s\w+=|\s*\/?>)/g)) {
        const value = m[1];
        // A fixed id is only a problem when the element carrying it is itself repeated by a .map().
        for (const lit of value.matchAll(/"([a-z][\w-]*)"/g)) {
            const repeated = (literalIds.get(lit[1]) ?? []).some((p) => inMap(p));
            if (repeated) report(file, lineOf(src, m.index), "static-ref-in-map", `references "${lit[1]}", an id rendered inside a .map().`);
        }
        for (const lit of value.matchAll(/"([a-z][\w-]*)"/g)) {
            const id = lit[1];
            if (literalIds.has(id)) continue;
            if (templateIdPrefixes.some((p) => p && id.startsWith(p))) continue;
            if (/^(true|false|dialog|listbox|menu|grid|tree|page|step|date|time|location|polite|assertive|off)$/.test(id)) continue;
            report(file, lineOf(src, m.index), "dangling-aria-ref", `references "${id}" but no element with that id is rendered in this file.`);
        }
    }

    // Every <Modal> needs exactly one accessible title source.
    for (const m of src.matchAll(/<Modal\b([\s\S]*?)>\s*(?=[\n<{])/g)) {
        const attrs = m[1];
        let depth = 0;
        let end = m.index + 6;
        for (; end < src.length; end++) {
            const c = src[end];
            if (c === "{") depth++;
            else if (c === "}") depth--;
            else if (c === ">" && depth === 0 && src[end - 1] !== "=") break;
        }
        const tag = src.slice(m.index, end);
        const sources = ["heading=", "titleInBody", " title="].filter((k) => tag.includes(k)).length;
        if (sources !== 1) report(file, lineOf(src, m.index), "modal-title", `<Modal> has ${sources} title sources (needs exactly one of heading, title, titleInBody).`);
        if (tag.includes("titleInBody") && !/ModalTitle|ViewHeader/.test(src)) report(file, lineOf(src, m.index), "modal-title", "titleInBody is set but no <ModalTitle>/<ViewHeader> renders the title.");
    }

    // Footer submit buttons must match exactly one form.
    for (const m of src.matchAll(/type="submit"\s+form="([^"]+)"/g)) {
        const forms = [...src.matchAll(new RegExp(`<form[^>]*\\sid="${m[1]}"`, "g"))].length;
        if (forms !== 1) report(file, lineOf(src, m.index), "form-link", `submit button points at form="${m[1]}" but ${forms} matching <form id> found.`);
    }

    // File inputs hidden with display:none are unreachable by keyboard unless a ref-driven button opens them.
    for (const m of src.matchAll(/<input\b[^>]*type="file"[^>]*>/g)) {
        if (/className="hidden"/.test(m[0]) && !/\sref=/.test(m[0])) report(file, lineOf(src, m.index), "hidden-file-input", "display:none file input with no ref-driven button; use sr-only so it stays focusable.");
    }
}

if (findings.length) {
    console.error(`check-a11y: ${findings.length} finding(s)\n` + findings.join("\n"));
    process.exit(1);
}
console.log("check-a11y: no findings");

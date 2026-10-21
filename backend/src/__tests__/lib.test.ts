import { describe, it } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { sniffImage } from "../lib/imageSniff";
import { normalizeScreenshot } from "../lib/processImage";
import { shippingFor } from "../services/pricing.service";
import jwt from "jsonwebtoken";
import { REMEMBER_MAX_AGE_MS, rememberOfToken, setAuthCookie, SESSION_MAX_AGE_MS } from "../lib/jwt";

describe("sniffImage", () => {
  it("identifies images by their bytes", () => {
    assert.equal(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
    assert.equal(sniffImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
    assert.equal(sniffImage(Buffer.from("RIFF\0\0\0\0WEBP")), "image/webp");
  });

  it("rejects other content, whatever it is named", () => {
    assert.equal(sniffImage(Buffer.from("just some text pretending to be a.png")), null);
    assert.equal(sniffImage(Buffer.alloc(0)), null);
  });
});

describe("normalizeScreenshot", () => {
  it("shrinks large images and drops metadata", async () => {
    const big = await sharp({ create: { width: 3200, height: 1600, channels: 3, background: "#fa0" } })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Copyright: "secret" } } })
      .toBuffer();
    const { data, mimeType } = await normalizeScreenshot(big);
    const meta = await sharp(data).metadata();
    assert.equal(mimeType, "image/webp");
    assert.equal(meta.format, "webp");
    assert.equal(meta.width, 1600);
    assert.equal(meta.exif, undefined);
  });

  it("does not enlarge small images", async () => {
    const small = await sharp({ create: { width: 300, height: 200, channels: 3, background: "#000" } }).png().toBuffer();
    const meta = await sharp((await normalizeScreenshot(small)).data).metadata();
    assert.equal(meta.width, 300);
  });

  it("refuses data that is not an image", async () => {
    await assert.rejects(normalizeScreenshot(Buffer.from("not an image")));
  });
});

describe("shippingFor", () => {
  it("applies the flat fee, free over the threshold, and nothing for an empty bag", () => {
    const rule = { flat: 150, freeOver: 2000 };
    assert.equal(shippingFor(rule, 1999), 150);
    assert.equal(shippingFor(rule, 2000), 0);
    assert.equal(shippingFor(rule, 0), 0);
    assert.equal(shippingFor({ flat: 150, freeOver: null }, 99999), 150);
  });
});

describe("setAuthCookie remember me", () => {
  function issue(remember?: boolean) {
    let opts: { maxAge?: number } = {};
    let token = "";
    const res = { cookie: (_n: string, t: string, o: { maxAge?: number }) => ((token = t), (opts = o)) } as never;
    setAuthCookie(res, "customer", 1, undefined, 0, remember);
    const { exp, iat } = jwt.decode(token) as { exp: number; iat: number };
    return { maxAge: opts.maxAge, lifetimeMs: (exp - iat) * 1000 };
  }

  it("keeps a persistent 30-day cookie when remembered", () => {
    assert.deepEqual(issue(true), { maxAge: REMEMBER_MAX_AGE_MS, lifetimeMs: REMEMBER_MAX_AGE_MS });
  });

  it("uses a browser-session cookie with a 24h token when not remembered", () => {
    assert.deepEqual(issue(false), { maxAge: undefined, lifetimeMs: 24 * 60 * 60 * 1000 });
  });

  it("reads the choice back from an issued token", () => {
    const tokenFor = (remember?: boolean) => {
      let t = "";
      setAuthCookie({ cookie: (_n: string, v: string) => (t = v) } as never, "customer", 1, undefined, 0, remember);
      return t;
    };
    assert.equal(rememberOfToken(tokenFor(true)), true);
    assert.equal(rememberOfToken(tokenFor(false)), false);
    assert.equal(rememberOfToken(tokenFor()), undefined);
    assert.equal(rememberOfToken(undefined), undefined);
  });

  it("keeps the 7-day default when unspecified", () => {
    assert.deepEqual(issue(), { maxAge: SESSION_MAX_AGE_MS, lifetimeMs: SESSION_MAX_AGE_MS });
  });
});

let ctx: AudioContext | null = null;

function getContext() {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    ctx ??= new AudioCtx();
    return ctx;
}

// Browsers only start audio after the visitor has clicked, tapped or typed on the page. Calling this on that first
// interaction unlocks sound for good, so a notification that arrives later (even while the tab is in the background) can ding.
export function unlockAudio() {
    try {
        const c = getContext();
        if (c && c.state === "suspended") void c.resume();
    } catch {
        // Audio unavailable: notifications still show without a sound.
    }
}

// A short two-note "ding" made with the Web Audio API, so there is no sound file to ship.
export function playDing() {
    try {
        const c = getContext();
        if (!c) return;
        if (c.state === "suspended") void c.resume();

        const start = c.currentTime;
        [880, 1318.5].forEach((freq, i) => {
            const osc = c.createOscillator();
            const gain = c.createGain();
            const t = start + i * 0.09;
            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
            osc.connect(gain).connect(c.destination);
            osc.start(t);
            osc.stop(t + 0.75);
        });
    } catch {
        // No audio available (blocked or unsupported): the visual notification still shows.
    }
}

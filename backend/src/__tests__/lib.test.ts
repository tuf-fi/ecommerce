import { describe, it } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { sniffImage } from "../lib/imageSniff";
import { normalizeScreenshot } from "../lib/processImage";
import { shippingFor } from "../services/pricing.service";

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

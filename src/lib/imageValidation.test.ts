import { describe, it, expect } from "vitest";
import {
  normalizeImageMimeType,
  detectImageMimeType,
  validateImageBytes,
  MAX_IMAGE_SIZE_BYTES,
  IMAGE_SIZE_ERROR_MESSAGE,
  IMAGE_UNSUPPORTED_FORMAT_MESSAGE,
  IMAGE_INVALID_TYPE_MESSAGE,
} from "./imageValidation";

describe("normalizeImageMimeType", () => {
  it("maps image/jpg to image/jpeg", () => {
    expect(normalizeImageMimeType("image/jpg")).toBe("image/jpeg");
  });

  it("returns supported mime types as-is", () => {
    expect(normalizeImageMimeType("image/png")).toBe("image/png");
    expect(normalizeImageMimeType("IMAGE/WEBP")).toBe("image/webp");
  });

  it("returns null for unsupported types", () => {
    expect(normalizeImageMimeType("image/heic")).toBeNull();
    expect(normalizeImageMimeType("application/pdf")).toBeNull();
  });
});

describe("detectImageMimeType", () => {
  it("detects jpeg/png/gif/webp by magic bytes", () => {
    expect(detectImageMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      "image/jpeg"
    );
    expect(
      detectImageMimeType(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      )
    ).toBe("image/png");
    expect(
      detectImageMimeType(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))
    ).toBe("image/gif");
    expect(
      detectImageMimeType(
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
        ])
      )
    ).toBe("image/webp");
  });

  it("returns null for unknown bytes", () => {
    expect(
      detectImageMimeType(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]))
    ).toBeNull();
  });
});

describe("validateImageBytes", () => {
  it("rejects oversized files", () => {
    const bytes = new Uint8Array(4);
    bytes.set([0xff, 0xd8, 0xff, 0xe0]);
    const result = validateImageBytes({
      bytes,
      size: MAX_IMAGE_SIZE_BYTES + 1,
    });
    expect(result).toEqual({ ok: false, error: IMAGE_SIZE_ERROR_MESSAGE });
  });

  it("rejects HEIC/AVIF with the unsupported-format message", () => {
    const heic = new Uint8Array([
      0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
    ]);
    const result = validateImageBytes({ bytes: heic, size: heic.length });
    expect(result).toEqual({
      ok: false,
      error: IMAGE_UNSUPPORTED_FORMAT_MESSAGE,
    });
  });

  it("accepts valid images and returns extension", () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
    const result = validateImageBytes({ bytes, size: bytes.length });
    expect(result).toEqual({
      ok: true,
      mimeType: "image/jpeg",
      extension: "jpg",
    });
  });

  it("rejects unrecognized bytes with the invalid-type message", () => {
    const bytes = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]);
    const result = validateImageBytes({ bytes, size: bytes.length });
    expect(result).toEqual({ ok: false, error: IMAGE_INVALID_TYPE_MESSAGE });
  });

  it("accepts the reported failing JPEG attachment (JFIF + ICC_PROFILE header)", () => {
    // 先頭32バイトは SAVE_20260815_093407.jpg（g-ohara 添付、アップロードに失敗した約4.18MBのJPEG）の実バイト
    const header = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xe2, 0x01, 0xd8,
      0x49, 0x43, 0x43, 0x5f, 0x50, 0x52, 0x4f, 0x46,
    ]);
    const result = validateImageBytes({ bytes: header, size: 4_381_255 });
    expect(result).toEqual({
      ok: true,
      mimeType: "image/jpeg",
      extension: "jpg",
    });
  });
});

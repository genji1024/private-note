import { describe, it, expect, vi, beforeEach } from "vitest";

const { compressionMock } = vi.hoisted(() => ({
  compressionMock: vi.fn(),
}));

vi.mock("browser-image-compression", () => ({
  default: compressionMock,
}));

import {
  compressImageIfNeeded,
  MAX_COMPRESSED_SIZE_MB,
} from "./imageCompression";
import { MAX_IMAGE_SIZE_BYTES } from "./imageValidation";

function makeFile(size: number, type = "image/jpeg"): File {
  return new File([new Uint8Array(size)], "photo.jpg", { type });
}

describe("compressImageIfNeeded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the original file unchanged when it is within the size limit", async () => {
    const file = makeFile(MAX_IMAGE_SIZE_BYTES);
    const result = await compressImageIfNeeded(file);
    expect(result).toBe(file);
    expect(compressionMock).not.toHaveBeenCalled();
  });

  it("compresses oversized files via a web worker", async () => {
    const file = makeFile(MAX_IMAGE_SIZE_BYTES + 1);
    const compressed = makeFile(1024);
    compressionMock.mockResolvedValue(compressed);
    const result = await compressImageIfNeeded(file);
    expect(result).toBe(compressed);
    expect(compressionMock).toHaveBeenCalledWith(file, {
      maxSizeMB: MAX_COMPRESSED_SIZE_MB,
      useWebWorker: true,
    });
  });

  it("falls back to the main thread when the web worker fails", async () => {
    const file = makeFile(MAX_IMAGE_SIZE_BYTES + 1);
    const compressed = makeFile(1024);
    compressionMock
      .mockRejectedValueOnce(new Error("worker unavailable"))
      .mockResolvedValueOnce(compressed);
    const result = await compressImageIfNeeded(file);
    expect(result).toBe(compressed);
    expect(compressionMock).toHaveBeenCalledTimes(2);
    expect(compressionMock).toHaveBeenLastCalledWith(file, {
      maxSizeMB: MAX_COMPRESSED_SIZE_MB,
      useWebWorker: false,
    });
  });

  it("returns the original file when compression fails entirely", async () => {
    const file = makeFile(MAX_IMAGE_SIZE_BYTES + 1);
    compressionMock.mockRejectedValue(new Error("GIF not supported"));
    const result = await compressImageIfNeeded(file);
    expect(result).toBe(file);
    expect(compressionMock).toHaveBeenCalledTimes(2);
  });
});

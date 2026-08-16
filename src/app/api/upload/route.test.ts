import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const { mockGetServerSession, uploadMock, getPublicUrlMock, mockAdmin } =
  vi.hoisted(() => {
    const mockGetServerSession = vi.fn();
    const uploadMock = vi.fn();
    const getPublicUrlMock = vi.fn();
    const fromMock = vi.fn();
    fromMock.mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    });
    const mockAdmin = {
      storage: {
        from: fromMock,
      },
    };
    return { mockGetServerSession, uploadMock, getPublicUrlMock, mockAdmin };
  });

vi.mock("next-auth", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: mockAdmin,
  supabase: {},
}));

import { POST } from "./route";
import {
  IMAGE_UNSUPPORTED_FORMAT_MESSAGE,
  IMAGE_SIZE_ERROR_MESSAGE,
  IMAGE_INVALID_TYPE_MESSAGE,
  UPLOAD_SAVE_ERROR_MESSAGE,
} from "@/lib/imageValidation";

const JPEG_MAGIC = [0xff, 0xd8, 0xff, 0xe0];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const HEIC_MAGIC = [
  ...Array(4).fill(0),
  0x66,
  0x74,
  0x79,
  0x70,
  0x68,
  0x65,
  0x69,
  0x63,
];

function buildRequest(
  bytes: Uint8Array<ArrayBuffer>,
  type: string,
  name: string
): Request {
  const formData = new FormData();
  formData.append("file", new File([bytes], name, { type }));
  return new Request("http://localhost/api/upload", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
  uploadMock.mockResolvedValue({ data: { path: "x/y.jpg" }, error: null });
  getPublicUrlMock.mockImplementation((fileName: string) => ({
    data: {
      publicUrl: `https://example.com/storage/v1/object/public/images/${fileName}`,
    },
  }));
});

describe("POST /api/upload", () => {
  it("rejects HEIC files with the dedicated unsupported-format message", async () => {
    const res = await POST(
      buildRequest(
        new Uint8Array(HEIC_MAGIC),
        "image/heic",
        "photo.heic"
      ) as unknown as NextRequest
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe(IMAGE_UNSUPPORTED_FORMAT_MESSAGE);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("normalizes image/jpg to image/jpeg and derives extension from magic bytes", async () => {
    const res = await POST(
      buildRequest(
        new Uint8Array(JPEG_MAGIC),
        "image/jpg",
        "photo.jpg"
      ) as unknown as NextRequest
    );
    expect(res.status).toBe(200);
    expect(uploadMock).toHaveBeenCalledTimes(1);
    const [fileName, , options] = uploadMock.mock.calls[0] as [
      string,
      Uint8Array,
      { contentType: string },
    ];
    expect(fileName).toMatch(/\.jpg$/);
    expect(options.contentType).toBe("image/jpeg");
    const body = await res.json();
    expect(body.url).toBe(
      `https://example.com/storage/v1/object/public/images/${fileName}`
    );
    expect(body.path).toBe(fileName);
  });

  it("rejects files larger than 5MB before reading bytes", async () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big[0] = 0xff;
    big[1] = 0xd8;
    big[2] = 0xff;
    const res = await POST(
      buildRequest(big, "image/jpeg", "big.jpg") as unknown as NextRequest
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe(IMAGE_SIZE_ERROR_MESSAGE);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("uploads a valid PNG and returns url/path", async () => {
    const res = await POST(
      buildRequest(
        new Uint8Array([...PNG_MAGIC, ...Array(8).fill(0)]),
        "image/png",
        "photo.png"
      ) as unknown as NextRequest
    );
    expect(res.status).toBe(200);
    expect(uploadMock).toHaveBeenCalledTimes(1);
    const body = await res.json();
    expect(body.url).toBeTruthy();
    expect(body.path).toBeTruthy();
  });

  it("rejects non-image bytes even when the declared type is an image", async () => {
    const res = await POST(
      buildRequest(
        new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]),
        "image/png",
        "fake.png"
      ) as unknown as NextRequest
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe(IMAGE_INVALID_TYPE_MESSAGE);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("accepts the reported failing ~4.18MB JPEG attachment", async () => {
    const bytes = new Uint8Array(4_381_255); // SAVE_20260815_093407.jpg の実サイズ
    bytes.set([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xe2, 0x01, 0xd8,
      0x49, 0x43, 0x43, 0x5f, 0x50, 0x52, 0x4f, 0x46,
    ]);
    const res = await POST(
      buildRequest(
        bytes,
        "image/jpeg",
        "SAVE_20260815_093407.jpg"
      ) as unknown as NextRequest
    );
    expect(res.status).toBe(200);
    expect(uploadMock).toHaveBeenCalledTimes(1);
    const [fileName, , options] = uploadMock.mock.calls[0] as [
      string,
      Uint8Array,
      { contentType: string },
    ];
    expect(fileName).toMatch(/\.jpg$/);
    expect(options.contentType).toBe("image/jpeg");
  });

  it("returns a JSON 500 when Supabase upload rejects", async () => {
    uploadMock.mockRejectedValue(new Error("network down"));
    const res = await POST(
      buildRequest(
        new Uint8Array(JPEG_MAGIC),
        "image/jpeg",
        "photo.jpg"
      ) as unknown as NextRequest
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe(UPLOAD_SAVE_ERROR_MESSAGE);
  });

  it("falls back to a clear message when Supabase error message is empty", async () => {
    uploadMock.mockResolvedValue({ data: null, error: { message: "" } });
    const res = await POST(
      buildRequest(
        new Uint8Array(JPEG_MAGIC),
        "image/jpeg",
        "photo.jpg"
      ) as unknown as NextRequest
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe(UPLOAD_SAVE_ERROR_MESSAGE);
  });
});

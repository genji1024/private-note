export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const IMAGE_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const IMAGE_SIZE_ERROR_MESSAGE =
  "ファイルサイズが5MBを超えています。5MB以下の画像をアップロードしてください。";

export const IMAGE_UNSUPPORTED_FORMAT_MESSAGE =
  "HEIC/HEIF/AVIF形式の画像には対応していません。JPEG・PNG・GIF・WebP形式に変換してアップロードしてください。";

export const IMAGE_INVALID_TYPE_MESSAGE =
  "対応していないファイル形式です。JPEG・PNG・GIF・WebP形式の画像をアップロードしてください。";

export const IMAGE_TRANSFER_TOO_LARGE_MESSAGE =
  "ファイルサイズが大きすぎるためアップロードできませんでした。5MB以下の画像をアップロードしてください。";

export const UPLOAD_READ_ERROR_MESSAGE =
  "アップロードされたファイルを読み込めませんでした。";
export const UPLOAD_SAVE_ERROR_MESSAGE = "画像の保存に失敗しました。";

export function normalizeImageMimeType(type: string): string | null {
  const lower = type.toLowerCase();
  const normalized = lower === "image/jpg" ? "image/jpeg" : lower;
  return (SUPPORTED_IMAGE_MIME_TYPES as readonly string[]).includes(normalized)
    ? normalized
    : null;
}

export function isJpeg(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  );
}

export function isPng(bytes: Uint8Array): boolean {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < signature.length) return false;
  return signature.every((byte, i) => bytes[i] === byte);
}

export function isGif(bytes: Uint8Array): boolean {
  if (bytes.length < 6) return false;
  const prefix =
    String.fromCharCode(bytes[0]) +
    String.fromCharCode(bytes[1]) +
    String.fromCharCode(bytes[2]) +
    String.fromCharCode(bytes[3]) +
    String.fromCharCode(bytes[4]) +
    String.fromCharCode(bytes[5]);
  return prefix === "GIF87a" || prefix === "GIF89a";
}

export function isWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const riff =
    String.fromCharCode(bytes[0]) +
    String.fromCharCode(bytes[1]) +
    String.fromCharCode(bytes[2]) +
    String.fromCharCode(bytes[3]);
  const webp =
    String.fromCharCode(bytes[8]) +
    String.fromCharCode(bytes[9]) +
    String.fromCharCode(bytes[10]) +
    String.fromCharCode(bytes[11]);
  return riff === "RIFF" && webp === "WEBP";
}

function hasFtypBox(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  return (
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  );
}

function readMajorBrand(bytes: Uint8Array): string {
  return String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
}

const HEIC_BRANDS = [
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
  "heif",
];

const AVIF_BRANDS = ["avif", "avis"];

export function isHeicOrHeif(bytes: Uint8Array): boolean {
  if (!hasFtypBox(bytes)) return false;
  return HEIC_BRANDS.includes(readMajorBrand(bytes));
}

export function isAvif(bytes: Uint8Array): boolean {
  if (!hasFtypBox(bytes)) return false;
  return AVIF_BRANDS.includes(readMajorBrand(bytes));
}

export function detectImageMimeType(bytes: Uint8Array): string | null {
  if (isJpeg(bytes)) return "image/jpeg";
  if (isPng(bytes)) return "image/png";
  if (isGif(bytes)) return "image/gif";
  if (isWebp(bytes)) return "image/webp";
  return null;
}

export type ImageValidationResult =
  | { ok: true; mimeType: string; extension: string }
  | { ok: false; error: string };

export function validateImageBytes(input: {
  bytes: Uint8Array;
  size: number;
}): ImageValidationResult {
  if (input.size > MAX_IMAGE_SIZE_BYTES) {
    return { ok: false, error: IMAGE_SIZE_ERROR_MESSAGE };
  }
  if (isHeicOrHeif(input.bytes) || isAvif(input.bytes)) {
    return { ok: false, error: IMAGE_UNSUPPORTED_FORMAT_MESSAGE };
  }
  const mime = detectImageMimeType(input.bytes);
  if (!mime) {
    return { ok: false, error: IMAGE_INVALID_TYPE_MESSAGE };
  }
  return { ok: true, mimeType: mime, extension: IMAGE_MIME_EXTENSIONS[mime] };
}

const UNSUPPORTED_SEQUENCE_TYPES = [
  "image/heic",
  "image/heif",
  "image/avif",
  "image/heic-sequence",
  "image/heif-sequence",
  "image/avif-sequence",
];

export function validateImageFile(file: File): string | null {
  // サイズ検証はここでは行わない。5MB 超の画像はクライアント側で自動圧縮
  // （imageCompression.ts の compressImageIfNeeded）し、サーバー側の
  // 5MB 検証をセーフティバルブとして維持する。
  const normalized = normalizeImageMimeType(file.type);
  if (normalized !== null) return null;
  if (UNSUPPORTED_SEQUENCE_TYPES.includes(file.type.toLowerCase())) {
    return IMAGE_UNSUPPORTED_FORMAT_MESSAGE;
  }
  return IMAGE_INVALID_TYPE_MESSAGE;
}

import { MAX_IMAGE_SIZE_BYTES } from "@/lib/imageValidation";

// 圧縮後の目標サイズ（MB）。サーバー側のセーフティバルブ（5MB 検証）に
// 合わせた値にする。圧縮しても 5MB を下回らない場合はサーバー側で拒否される。
export const MAX_COMPRESSED_SIZE_MB = 5;

/**
 * 5MB を超える画像をアップロード前に自動圧縮する。
 *
 * - 5MB 以下ならそのまま返す（圧縮しない）
 * - 圧縮はまず Web Worker で実行し、失敗した場合はメインスレッドで再試行する
 * - それでも失敗した場合（GIF など非対応形式・動的読み込み失敗）は元ファイルを
 *   返し、サーバー側のセーフティバルブ（5MB 検証）に判定を委ねる
 *
 * この関数は例外を投げない（呼び出し側は reject を気にしなくてよい）。
 */
export async function compressImageIfNeeded(file: File): Promise<File> {
  if (file.size <= MAX_IMAGE_SIZE_BYTES) {
    return file;
  }

  try {
    const { default: imageCompression } =
      await import("browser-image-compression");
    try {
      return await imageCompression(file, {
        maxSizeMB: MAX_COMPRESSED_SIZE_MB,
        useWebWorker: true,
      });
    } catch {
      return await imageCompression(file, {
        maxSizeMB: MAX_COMPRESSED_SIZE_MB,
        useWebWorker: false,
      });
    }
  } catch {
    return file;
  }
}

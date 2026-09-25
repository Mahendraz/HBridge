export class UploadAbortedError extends Error {
  constructor() {
    super("Upload dibatalkan.");
    this.name = "UploadAbortedError";
  }
}

/**
 * Uploads a single file via XMLHttpRequest (not fetch) so upload progress
 * (xhr.upload.onprogress) is observable — fetch has no equivalent for request
 * bodies, which is why report-media uploads could previously only show an
 * indefinite spinner, regardless of how large the video was.
 *
 * Resolves with the parsed JSON response body (null if it isn't JSON).
 * Aborting via `signal` rejects with UploadAbortedError.
 */
export function uploadFileWithProgress(
  url: string,
  formData: FormData,
  token: string,
  onProgress: (loadedBytes: number) => void,
  signal?: AbortSignal
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadAbortedError());
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };

    const parseBody = () => {
      try {
        return JSON.parse(xhr.responseText);
      } catch {
        return null;
      }
    };

    xhr.onload = () => {
      const body = parseBody();
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else reject(new Error(body?.error || `Upload gagal (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Terjadi kesalahan jaringan saat upload."));
    xhr.onabort = () => reject(new UploadAbortedError());
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });

    xhr.send(formData);
  });
}

/**
 * Uploads a single file via XMLHttpRequest (not fetch) so upload progress
 * (xhr.upload.onprogress) is observable — fetch has no equivalent for request
 * bodies, which is why report-media uploads could previously only show an
 * indefinite spinner, regardless of how large the video was.
 */
export function uploadFileWithProgress(
  url: string,
  formData: FormData,
  token: string,
  onProgress: (loadedBytes: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload gagal (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Terjadi kesalahan jaringan saat upload."));
    xhr.send(formData);
  });
}

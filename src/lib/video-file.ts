// Browser-only helpers for the upload form. No secrets here.

export type VideoDetails = { durationSeconds: number | null; thumbnail: Blob | null };

const THUMBNAIL_MAX_WIDTH = 1280;

/** Reads the duration and grabs a JPEG frame (~1s in) from a local video file. */
export function readVideoDetails(file: File): Promise<VideoDetails> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const finish = (details: VideoDetails) => {
      URL.revokeObjectURL(objectUrl);
      resolve(details);
    };

    video.onerror = () => finish({ durationSeconds: null, thumbnail: null });
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 2);
    };
    video.onseeked = () => {
      const durationSeconds = Number.isFinite(video.duration) ? Math.round(video.duration) : null;
      const scale = Math.min(1, THUMBNAIL_MAX_WIDTH / video.videoWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext('2d');
      if (!context) return finish({ durationSeconds, thumbnail: null });

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((thumbnail) => finish({ durationSeconds, thumbnail }), 'image/jpeg', 0.82);
    };
    video.src = objectUrl;
  });
}

/** PUTs a file to a Supabase signed upload URL, reporting progress 0–1. */
export function uploadToSignedUrl(
  signedUrl: string,
  file: Blob,
  contentType: string,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', signedUrl);
    request.setRequestHeader('content-type', contentType);
    request.setRequestHeader('x-upsert', 'false');
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`Upload failed with status ${request.status}`));
    request.onerror = () => reject(new Error('Network error during upload'));
    request.send(file);
  });
}

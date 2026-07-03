/**
 * Client-side video thumbnail (poster) generation.
 *
 * Loads a selected video file into an off-screen <video>, seeks to an early
 * frame, and draws it onto a canvas to produce a JPEG poster image. This keeps
 * thumbnail creation in the browser so it works on serverless hosts (no ffmpeg).
 */

const POSTER_FILE_NAME = "poster.jpg";

export function isPosterCaptureSupported(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    typeof HTMLCanvasElement.prototype.toBlob === "function"
  );
}

export async function generateVideoPoster(
  file: File,
  seekSeconds = 1,
): Promise<File | null> {
  if (!isPosterCaptureSupported() || !file.type.startsWith("video/")) {
    return null;
  }

  return new Promise<File | null>((resolve) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    const finish = (result: File | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const capture = () => {
      try {
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          finish(null);
          return;
        }
        context.drawImage(video, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              finish(null);
              return;
            }
            finish(new File([blob], POSTER_FILE_NAME, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.82,
        );
      } catch {
        finish(null);
      }
    };

    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.crossOrigin = "anonymous";

    video.addEventListener("loadeddata", () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const target = duration > 0 ? Math.min(seekSeconds, duration / 2) : 0;
      if (target > 0) {
        try {
          video.currentTime = target;
          return;
        } catch {
          // fall through to immediate capture
        }
      }
      capture();
    });

    video.addEventListener("seeked", capture);
    video.addEventListener("error", () => finish(null));

    // Safety timeout so the UI never hangs waiting on a bad file.
    setTimeout(() => finish(null), 15000);

    video.src = objectUrl;
  });
}

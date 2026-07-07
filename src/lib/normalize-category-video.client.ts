import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { detectMp4VideoCodec, needsWebSafeTranscode } from "@/lib/mp4-codec-hint";

const FFMPEG_CORE_VERSION = "0.12.10";
const FFMPEG_CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<FFmpeg> | null = null;

async function getFfmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (!ffmpegLoading) {
    ffmpegLoading = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      });
      ffmpegInstance = ffmpeg;
      return ffmpeg;
    })();
  }
  return ffmpegLoading;
}

/**
 * Ensure a category video is H.264/AAC MP4 with faststart so it plays on iPhone.
 * Already-H.264 files pass through unchanged.
 */
export async function normalizeCategoryVideoForUpload(
  file: File,
  onStatus?: (message: string) => void,
): Promise<File> {
  const hint = await detectMp4VideoCodec(file);
  if (!needsWebSafeTranscode(hint)) return file;

  onStatus?.("Converting video for iPhone compatibility…");

  const ffmpeg = await getFfmpeg();
  const inputName = `input-${Date.now()}.mp4`;
  const outputName = `output-${Date.now()}.mp4`;

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i",
    inputName,
    "-vf",
    "scale='min(1280,iw)':-2",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
  const baseName = file.name.replace(/\.[^.]+$/, "") || "video";
  return new File([bytes as BlobPart], `${baseName}.mp4`, { type: "video/mp4" });
}

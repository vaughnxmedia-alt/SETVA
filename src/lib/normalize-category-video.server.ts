import { execFileSync } from "child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

function hasFfmpeg(): boolean {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function videoCodec(filePath: string): string {
  return execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=codec_name",
      "-of",
      "csv=p=0",
      filePath,
    ],
    { encoding: "utf8" },
  ).trim();
}

function isWebSafeH264(codec: string): boolean {
  return codec === "h264" || codec === "avc1";
}

/** Server-side H.264 normalize when ffmpeg is available (local dev). No-op on Vercel. */
export function normalizeCategoryVideoBuffer(input: Buffer): Buffer {
  if (!hasFfmpeg()) return input;

  const workDir = mkdtempSync(join(tmpdir(), "setva-upload-vid-"));
  const inputPath = join(workDir, "input.mp4");
  const outputPath = join(workDir, "output.mp4");

  try {
    writeFileSync(inputPath, input);
    const codec = videoCodec(inputPath);
    if (isWebSafeH264(codec)) return input;

    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-loglevel",
        "error",
        "-i",
        inputPath,
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
        outputPath,
      ],
      { stdio: "pipe" },
    );

    return readFileSync(outputPath);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

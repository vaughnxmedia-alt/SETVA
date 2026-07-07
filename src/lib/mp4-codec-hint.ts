/** Quick MP4 codec sniff — reads the head/tail for avc1/h264 vs vp09/vp9 tags. */
export type Mp4CodecHint = "h264" | "vp9" | "unknown";

export async function detectMp4VideoCodec(file: File): Promise<Mp4CodecHint> {
  const headSize = Math.min(file.size, 1024 * 1024);
  const tailSize = Math.min(file.size, 2 * 1024 * 1024);
  const head = new TextDecoder("latin1").decode(
    new Uint8Array(await file.slice(0, headSize).arrayBuffer()),
  );
  const tail = new TextDecoder("latin1").decode(
    new Uint8Array(await file.slice(Math.max(0, file.size - tailSize)).arrayBuffer()),
  );
  const sample = `${head}\n${tail}`;

  if (/avc1|h264|avcC/i.test(sample)) return "h264";
  if (/vp09|vp9|vp08/i.test(sample)) return "vp9";
  return "unknown";
}

export function needsWebSafeTranscode(hint: Mp4CodecHint): boolean {
  return hint !== "h264";
}

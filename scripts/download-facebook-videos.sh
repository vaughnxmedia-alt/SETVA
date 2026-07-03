#!/usr/bin/env bash
#
# Batch-download public Facebook videos as category-named mp4s, ready to
# bulk-upload through Headquarters -> Import nomination media package.
#
# Usage:
#   1. Fill in scripts/facebook-video-list.txt with one line per video:
#        category-id | https://www.facebook.com/watch/?v=...
#      (lines starting with # are ignored; the category-id becomes the filename)
#   2. Run:
#        ./scripts/download-facebook-videos.sh
#
#   If a video needs your Facebook login (many "public" videos still do),
#   pass the browser you're logged into Facebook with:
#        COOKIES_FROM=chrome ./scripts/download-facebook-videos.sh
#      supported: chrome | safari | firefox | edge | brave
#
# Output: facebook-downloads/<category-id>.mp4
#
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIST_FILE="${ROOT_DIR}/scripts/facebook-video-list.txt"
OUT_DIR="${ROOT_DIR}/facebook-downloads"

if ! command -v yt-dlp >/dev/null 2>&1; then
  echo "yt-dlp is not installed. Install with: brew install yt-dlp ffmpeg"
  exit 1
fi

if [ ! -f "$LIST_FILE" ]; then
  echo "Missing $LIST_FILE"
  echo "Create it with lines like:  category-id | https://facebook.com/..."
  exit 1
fi

mkdir -p "$OUT_DIR"

# Facebook often serves the highest resolution as VP9, which Safari/iOS cannot
# play inside an mp4. Re-encode to H.264 + AAC only when needed so every
# category video plays in all browsers while keeping the best source quality.
normalize_to_h264() {
  local file="$1"
  [ -f "$file" ] || return 0
  command -v ffprobe >/dev/null 2>&1 || return 0

  local vcodec
  vcodec="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=nw=1:nk=1 "$file" 2>/dev/null)"
  case "$vcodec" in
    h264|avc1) return 0;;  # already web-safe
  esac

  echo "  Re-encoding ${vcodec:-unknown} -> H.264 for web compatibility..."
  local tmp="${file%.mp4}.h264.mp4"
  if ffmpeg -y -loglevel error -i "$file" \
      -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p \
      -c:a aac -b:a 160k -movflags +faststart "$tmp" 2>/dev/null; then
    mv -f "$tmp" "$file"
  else
    echo "  Warning: re-encode failed; keeping original ($vcodec)."
    rm -f "$tmp"
  fi
}

COOKIE_ARGS=()
if [ -n "${COOKIES_FROM:-}" ]; then
  COOKIE_ARGS=(--cookies-from-browser "$COOKIES_FROM")
  echo "Using login cookies from: $COOKIES_FROM"
fi

ok=0
fail=0
failed_list=()

skipped=0
while IFS= read -r raw || [ -n "$raw" ]; do
  line="$(printf '%s' "$raw" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  # Skip blanks and comment lines.
  [ -z "$line" ] && continue
  case "$line" in "#"*) continue;; esac
  # Only lines that actually contain a "|" are entries.
  case "$line" in *"|"*) ;; *) continue;; esac

  # Split on the first "|" using parameter expansion (robust when no URL yet).
  id="${line%%|*}"
  url="${line#*|}"
  id="$(printf '%s' "$id" | sed 's/[[:space:]]*$//;s/^[[:space:]]*//')"
  url="$(printf '%s' "$url" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

  # Silently skip entries that don't have a URL filled in yet.
  if [ -z "$id" ] || [ -z "$url" ]; then
    skipped=$((skipped + 1))
    continue
  fi

  echo ""
  echo "=== $id ==="
  out_file="${OUT_DIR}/${id}.mp4"
  if yt-dlp \
      ${COOKIE_ARGS[@]+"${COOKIE_ARGS[@]}"} \
      -f 'bv*+ba/b' \
      --merge-output-format mp4 \
      --no-playlist \
      --restrict-filenames \
      -o "${OUT_DIR}/${id}.%(ext)s" \
      "$url"; then
    normalize_to_h264 "$out_file"
    ok=$((ok + 1))
  else
    fail=$((fail + 1))
    failed_list+=("$id")
  fi
done < "$LIST_FILE"

echo ""
echo "==================================="
echo "Downloaded: $ok   Failed: $fail   Not filled in yet: $skipped"
echo "Saved to:   $OUT_DIR"
if [ "$fail" -gt 0 ]; then
  echo "Failed ids: ${failed_list[*]}"
  echo "Tip: if failures say login/private, re-run with COOKIES_FROM=chrome (or safari/firefox)."
fi

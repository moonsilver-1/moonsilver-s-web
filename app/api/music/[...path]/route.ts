import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const MUSIC_DIR = path.join(process.cwd(), "music");

const MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".webm": "audio/webm",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const filePath = path.join(MUSIC_DIR, ...segments);

  if (!filePath.startsWith(MUSIC_DIR)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return new NextResponse("Not Found", { status: 404 });
    }
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";

  const data = await readFile(filePath);
  return new NextResponse(data, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": data.length.toString(),
      "Cache-Control": "public, max-age=86400",
    },
  });
}

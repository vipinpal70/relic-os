import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".pdf": return "application/pdf";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".gif": return "image/gif";
    case ".webp": return "image/webp";
    case ".txt": return "text/plain";
    case ".html": return "text/html";
    default: return "application/octet-stream";
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const filePath = path.join(process.cwd(), "public", "uploads", filename);

    // Read the file contents from storage
    const fileBuffer = await fs.readFile(filePath);
    const mimeType = getMimeType(filename);

    // Return the file with proper mimetype headers for inline preview
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error serving dynamic upload preview:", error);
    return new Response("File not found", { status: 404 });
  }
}

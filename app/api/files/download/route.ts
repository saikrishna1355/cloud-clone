import { NextRequest, NextResponse } from "next/server";
import { FileRepository } from "@/repositories/file.repository";
import { downloadFile } from "@/services/s3";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const file = await FileRepository.findById(id);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await downloadFile(file.key);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}

import { NextResponse } from "next/server";
import { FileRepository } from "@/repositories/file.repository";
import { getSession } from "@/lib/auth";

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const files = await FileRepository.findAll();
  return NextResponse.json(files);
}

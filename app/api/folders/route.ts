import { NextRequest, NextResponse } from "next/server";
import { FolderRepository } from "@/repositories/folder.repository";
import { getSession } from "@/lib/auth";

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const folders = await FolderRepository.findAll();
  return NextResponse.json(folders);
}

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, parentId } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const folder = await FolderRepository.create(name.trim(), parentId ?? "root");
  return NextResponse.json(folder, { status: 201 });
}

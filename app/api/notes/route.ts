import { NextRequest, NextResponse } from "next/server";
import { NoteRepository } from "@/repositories/note.repository";
import { writeJson } from "@/services/s3";
import { getSession } from "@/lib/auth";

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notes = await NoteRepository.findAll();
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title, folderId } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const note = await NoteRepository.create(title.trim(), folderId ?? "root");
  await writeJson(note.file, "");
  return NextResponse.json(note, { status: 201 });
}

import { readJson, writeJson } from "@/services/s3";
import { Note } from "@/types";
import { nanoid } from "@/utils/nanoid";

const KEY = "metadata/notes.json";

function defaultExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString();
}

async function getAll(): Promise<Note[]> {
  const notes = await readJson<Note[]>(KEY);
  return Array.isArray(notes) ? notes : [];
}

async function save(notes: Note[]): Promise<void> {
  await writeJson(KEY, notes);
}

export const NoteRepository = {
  async findAll(): Promise<Note[]> {
    return getAll();
  },

  async findById(id: string): Promise<Note | undefined> {
    const all = await getAll();
    return all.find((n) => n.id === id);
  },

  async findByFolder(folderId: string): Promise<Note[]> {
    const all = await getAll();
    return all.filter((n) => n.folderId === folderId && !n.trashedAt);
  },

  async findTrashed(): Promise<Note[]> {
    const all = await getAll();
    return all.filter((n) => !!n.trashedAt);
  },

  async create(title: string, folderId: string): Promise<Note> {
    const all = await getAll();
    const id = nanoid();
    const now = new Date().toISOString();
    const note: Note = { id, title, folderId, file: `notes/${id}.md`, createdAt: now, updatedAt: now, expiresAt: defaultExpiry() };
    await save([...all, note]);
    return note;
  },

  async update(id: string, patch: Partial<Note>): Promise<Note> {
    const all = await getAll();
    const now = new Date().toISOString();
    const updated = all.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now } : n));
    await save(updated);
    return updated.find((n) => n.id === id)!;
  },

  async delete(id: string): Promise<void> {
    const all = await getAll();
    await save(all.filter((n) => n.id !== id));
  },
};

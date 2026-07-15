import { readJson, writeJson } from "@/services/s3";
import { DriveFile } from "@/types";
import { nanoid } from "@/utils/nanoid";

const KEY = "metadata/files.json";

function defaultExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString();
}

async function getAll(): Promise<DriveFile[]> {
  const files = await readJson<DriveFile[]>(KEY);
  return Array.isArray(files) ? files : [];
}

async function save(files: DriveFile[]): Promise<void> {
  await writeJson(KEY, files);
}

export const FileRepository = {
  async findAll(): Promise<DriveFile[]> {
    return getAll();
  },

  async findById(id: string): Promise<DriveFile | undefined> {
    const all = await getAll();
    return all.find((f) => f.id === id);
  },

  async findByFolder(folderId: string): Promise<DriveFile[]> {
    const all = await getAll();
    return all.filter((f) => f.folderId === folderId && !f.trashedAt);
  },

  async findTrashed(): Promise<DriveFile[]> {
    const all = await getAll();
    return all.filter((f) => !!f.trashedAt);
  },

  async create(data: Omit<DriveFile, "id" | "createdAt" | "updatedAt">): Promise<DriveFile> {
    const all = await getAll();
    const now = new Date().toISOString();
    const file: DriveFile = { ...data, id: nanoid(), createdAt: now, updatedAt: now, expiresAt: defaultExpiry() };
    await save([...all, file]);
    return file;
  },

  async update(id: string, patch: Partial<DriveFile>): Promise<DriveFile> {
    const all = await getAll();
    const now = new Date().toISOString();
    const updated = all.map((f) => (f.id === id ? { ...f, ...patch, updatedAt: now } : f));
    await save(updated);
    return updated.find((f) => f.id === id)!;
  },

  async delete(id: string): Promise<void> {
    const all = await getAll();
    await save(all.filter((f) => f.id !== id));
  },
};

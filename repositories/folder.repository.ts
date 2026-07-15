import { readJson, writeJson } from "@/services/s3";
import { Folder } from "@/types";
import { nanoid } from "@/utils/nanoid";

const KEY = "metadata/folders.json";

function defaultExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString();
}

const ROOT: Folder = { id: "root", name: "Home", parentId: null, createdAt: new Date().toISOString() };

async function getAll(): Promise<Folder[]> {
  const folders = await readJson<Folder[]>(KEY);
  if (!Array.isArray(folders) || folders.length === 0) return [ROOT];
  return folders;
}

async function save(folders: Folder[]): Promise<void> {
  await writeJson(KEY, folders);
}

export const FolderRepository = {
  async findAll(): Promise<Folder[]> {
    return getAll();
  },

  async findById(id: string): Promise<Folder | undefined> {
    const all = await getAll();
    return all.find((f) => f.id === id);
  },

  async create(name: string, parentId: string | null = "root"): Promise<Folder> {
    const all = await getAll();
    const folder: Folder = { id: nanoid(), name, parentId, createdAt: new Date().toISOString(), expiresAt: defaultExpiry() };
    await save([...all, folder]);
    return folder;
  },

  async update(id: string, patch: Partial<Folder>): Promise<Folder> {
    const all = await getAll();
    const updated = all.map((f) => (f.id === id ? { ...f, ...patch } : f));
    await save(updated);
    return updated.find((f) => f.id === id)!;
  },

  async delete(id: string): Promise<void> {
    const all = await getAll();
    await save(all.filter((f) => f.id !== id));
  },
};

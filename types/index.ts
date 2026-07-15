export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  isFavorite?: boolean;
  expiresAt?: string | null;
}

export interface DriveFile {
  id: string;
  name: string;
  folderId: string;
  key: string;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  trashedAt?: string;
  expiresAt?: string | null;
}

export interface Note {
  id: string;
  title: string;
  folderId: string;
  file: string;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  trashedAt?: string;
  expiresAt?: string | null;
}

export interface Settings {
  theme: "light" | "dark" | "system";
  appVersion: string;
}

export type ItemType = "folder" | "file" | "note";

export interface SearchResult {
  id: string;
  name: string;
  type: ItemType;
  folderId?: string;
}

import { useUserStore } from "@/stores/user";
import { apiBase } from "@/utils/api-url";

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
}

export const uploadedFileUrl = (url: string) => `${apiBase()}/api/v2/static${url}`;

export const uploadFiles = async (files: File[]): Promise<UploadedFile[]> => {
  const userStore = useUserStore();
  const form = new FormData();
  files.forEach((file) => form.append("file", file));

  const headers: Record<string, string> = {};
  if (userStore.token) headers.Authorization = `Bearer ${userStore.token}`;

  const res = await fetch(`${apiBase()}/api/v2/files/upload`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json().catch(() => null);
  const list: unknown[] = Array.isArray(data?.files) ? data.files : [];
  return list.map((item) => {
    const file = item as Record<string, unknown>;
    return {
      url: String(file.url ?? ""),
      name: String(file.originalName ?? file.url ?? ""),
      size: Number(file.size ?? 0),
    };
  });
};

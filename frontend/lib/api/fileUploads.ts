import { api } from "@/lib/api/client";
import type { FileUploadResponse } from "@/types/fileUploads";

export function uploadFile(file: File, category: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);

  return api
    .post<FileUploadResponse>("/files", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
}

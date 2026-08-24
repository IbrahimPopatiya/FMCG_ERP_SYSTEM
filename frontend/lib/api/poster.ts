import { api } from "@/lib/api/client";
import type { PosterGenerateResponse } from "@/types/poster";

export function generatePoster(image: File, prompt: string) {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("prompt", prompt);

  return api
    .post<PosterGenerateResponse>("/poster/generate", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      // AI image generation regularly takes 20-30s+ - well past axios's
      // default (none, so this only guards against a genuinely hung request).
      timeout: 120_000,
    })
    .then((res) => res.data);
}

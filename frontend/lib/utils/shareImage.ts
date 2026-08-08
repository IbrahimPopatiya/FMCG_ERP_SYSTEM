// Fetches a product image and converts it into a File so it can be attached
// to the Web Share API (navigator.share({ files })) — this is what makes
// WhatsApp etc. show the actual image in the chat instead of a link preview.
// Returns null if the image can't be fetched (e.g. CORS-blocked host) so
// callers can fall back to sharing a link instead.
export async function imageUrlToFile(url: string, filename: string): Promise<File | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || "image/jpeg" });
  } catch {
    return null;
  }
}

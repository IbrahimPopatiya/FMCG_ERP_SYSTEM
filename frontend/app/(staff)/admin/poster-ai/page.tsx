"use client";

import { useState } from "react";
import Image from "next/image";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProductImageField } from "@/components/products/ProductImageField";
import { SparkleIcon, DownloadIcon, RefreshIcon, PencilIcon } from "@/components/admin/icons";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { generatePoster } from "@/lib/api/poster";
import { POSTER_PROMPTS } from "@/lib/poster/prompts";

const PRODUCT_COUNTS = [1, 2, 3] as const;
const CUSTOM_PROMPT_MAX_LENGTH = 1000;

type CreationMode = "premade" | "custom";

export default function PosterAiPage() {
  useRoleGuard(["admin"]);

  const [mode, setMode] = useState<CreationMode>("premade");
  const [promptId, setPromptId] = useState(POSTER_PROMPTS[0]?.id ?? "");
  const [customPrompt, setCustomPrompt] = useState("");
  const [productCount, setProductCount] = useState<1 | 2 | 3>(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  function handleImageSelected(file: File) {
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleImageRemoved() {
    setImageFile(null);
    setPreviewUrl(null);
  }

  async function buildPrompt(): Promise<string | null> {
    if (mode === "custom") {
      const text = customPrompt.trim();
      if (!text) {
        setError("Describe the advertisement you want first.");
        return null;
      }
      return `${text}\n\nNumber of product displays: ${productCount}. Use the uploaded product image as the primary reference - keep the real packaging, branding, colors, and text unchanged.`;
    }

    const prompt = POSTER_PROMPTS.find((p) => p.id === promptId);
    if (!prompt) {
      setError("Choose a prompt style first.");
      return null;
    }
    const template = await fetch(prompt.file).then((res) => res.text());
    return template.replaceAll("{{PRODUCT_COUNT}}", String(productCount));
  }

  async function handleGenerate() {
    setError(null);

    if (!imageFile) {
      setError("Upload a product image first.");
      return;
    }

    setIsGenerating(true);
    try {
      const finalPrompt = await buildPrompt();
      if (!finalPrompt) return;

      const result = await generatePoster(imageFile, finalPrompt);
      setPosterUrl(result.image);
    } catch {
      setError("Couldn't generate the ad. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div>
      <TopBar title="Poster AI" />

      <header className="border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <SparkleIcon className="h-5 w-5 text-primary" />
          Create Product Ad
        </h1>
        <p className="mt-0.5 text-sm text-ink-muted">Turn a product photo into a professional advertisement with AI.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          <Card>
            <p className="mb-1 text-sm font-semibold text-ink">1. How do you want to create your ad?</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode("premade")}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                  mode === "premade" ? "border-primary bg-primary-soft" : "border-border hover:bg-surface"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <SparkleIcon className="h-4 w-4" />
                </span>
                <span>
                  <p className="text-sm font-semibold text-ink">Use Pre-made Prompt</p>
                  <p className="mt-0.5 text-xs text-ink-muted">Choose a ready-made advertising style.</p>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                  mode === "custom" ? "border-primary bg-primary-soft" : "border-border hover:bg-surface"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <PencilIcon className="h-4 w-4" />
                </span>
                <span>
                  <p className="text-sm font-semibold text-ink">Create Your Own</p>
                  <p className="mt-0.5 text-xs text-ink-muted">Write your own instructions for the AI.</p>
                </span>
              </button>
            </div>
          </Card>

          {mode === "premade" ? (
            <Card>
              <p className="mb-1 text-sm font-semibold text-ink">2. Choose a prompt</p>
              <p className="mb-3 text-xs text-ink-muted">Select a style that matches your product.</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {POSTER_PROMPTS.map((prompt) => {
                  const active = prompt.id === promptId;
                  return (
                    <button
                      key={prompt.id}
                      type="button"
                      onClick={() => setPromptId(prompt.id)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        active ? "border-primary bg-primary-soft" : "border-border hover:bg-surface"
                      }`}
                    >
                      <p className="text-sm font-semibold text-ink">{prompt.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">{prompt.description}</p>
                    </button>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card>
              <p className="mb-1 text-sm font-semibold text-ink">2. Describe your advertisement</p>
              <p className="mb-3 text-xs text-ink-muted">Write clear instructions for the AI to generate your ad.</p>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value.slice(0, CUSTOM_PROMPT_MAX_LENGTH))}
                maxLength={CUSTOM_PROMPT_MAX_LENGTH}
                rows={5}
                placeholder="Create a premium product advertisement with the product centered on a clean studio background, soft professional lighting, realistic shadows and a modern commercial photography style."
                className="w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-3 text-sm text-ink outline-none placeholder:text-ink-muted/60 focus:border-primary"
              />
              <p className="mt-1.5 text-right text-xs text-ink-muted">
                {customPrompt.length} / {CUSTOM_PROMPT_MAX_LENGTH}
              </p>
            </Card>
          )}

          <Card>
            <p className="mb-1 text-sm font-semibold text-ink">3. Upload product image</p>
            <p className="mb-3 text-xs text-ink-muted">Use a clear, well-lit photo of the product.</p>
            <ProductImageField previewUrl={previewUrl} onFileSelected={handleImageSelected} onRemove={handleImageRemoved} />
          </Card>

          <Card>
            <p className="mb-1 text-sm font-semibold text-ink">4. Number of products</p>
            <p className="mb-3 text-xs text-ink-muted">How many products should appear in the advertisement?</p>
            <div className="flex gap-2">
              {PRODUCT_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setProductCount(count)}
                  className={`flex h-11 flex-1 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                    productCount === count
                      ? "border-primary bg-primary text-white"
                      : "border-border text-ink hover:bg-surface"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <p className="mb-1 text-sm font-semibold text-ink">5. Generate your advertisement</p>
            <p className="mb-3 text-xs text-ink-muted">AI generation usually takes a few seconds.</p>

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
            )}

            <Button type="button" className="w-full gap-2" isLoading={isGenerating} onClick={handleGenerate}>
              <SparkleIcon className="h-4 w-4" />
              {isGenerating ? "Generating…" : "Generate Ad"}
            </Button>
          </Card>
        </div>

        <Card className="flex flex-col gap-3 lg:sticky lg:top-6">
          <p className="text-sm font-semibold text-ink">Preview</p>
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-surface">
            {posterUrl ? (
              <Image src={posterUrl} alt="Generated advertisement" fill unoptimized className="object-contain" />
            ) : isGenerating ? (
              <div className="flex flex-col items-center gap-2 text-ink-muted">
                <SparkleIcon className="h-6 w-6 animate-pulse text-primary" />
                <p className="text-sm">Generating your ad…</p>
              </div>
            ) : (
              <p className="px-6 text-center text-sm text-ink-muted">
                Your generated advertisement will appear here.
              </p>
            )}
          </div>

          {posterUrl && (
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1 gap-2" onClick={handleGenerate} isLoading={isGenerating}>
                <RefreshIcon className="h-4 w-4" />
                Regenerate
              </Button>
              <a
                href={posterUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                <DownloadIcon className="h-4 w-4" />
                Download
              </a>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

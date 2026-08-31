import type { ImageSize } from "../types";

const BASE = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image";

/** Build a real generated-image URL from a descriptive prompt. */
export function genImg(prompt: string, size: ImageSize = "square"): string {
  const params = new URLSearchParams({ prompt, image_size: size });
  return `${BASE}?${params.toString()}`;
}

/** Resolve image source: pass through URLs, generate from prompt otherwise. */
export function resolveImg(prompt: string, size: ImageSize = "square"): string {
  if (prompt.startsWith("http") || prompt.startsWith("data:") || prompt.startsWith("blob:")) {
    return prompt;
  }
  return genImg(prompt, size);
}

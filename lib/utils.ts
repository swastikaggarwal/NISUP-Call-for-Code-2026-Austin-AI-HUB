import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Standard shadcn-style className combiner.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function randomId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

// Short human reference like NIS-8F3K2 for report confirmations.
export function referenceId(): string {
  return "NIS-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

// Reads a File as a base64 data URL so it can be stored in the case record and
// rendered later on the public article page (survives navigation, unlike an
// object URL). MVP only. // TODO: upload to object storage + encrypt in prod.
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

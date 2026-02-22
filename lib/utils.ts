import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Paleta de temas do terminal ───────────────────────────────
export const CORES_TEMA: Record<string, string> = {
  amber:  '#F59E0B',
  green:  '#10B981',
  blue:   '#3B82F6',
  purple: '#8B5CF6',
  red:    '#EF4444',
  cyan:   '#06B6D4',
  rose:   '#F43F5E',
  slate:  '#94A3B8',
}

export function corParaTema(tema: string): string {
  return CORES_TEMA[tema] ?? '#F59E0B'
}

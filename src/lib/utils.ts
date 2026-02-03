import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { InputValues } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Encode inputs to URL query params for shareable links
 */
export function encodeInputsToURL(inputs: InputValues): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(inputs)) {
    if (value) {
      params.set(key, value);
    }
  }
  return params.toString();
}

/**
 * Decode URL query params to inputs
 */
export function decodeInputsFromURL(search: string): Partial<InputValues> {
  const params = new URLSearchParams(search);
  const inputs: Partial<InputValues> = {};

  const keys: (keyof InputValues)[] = [
    'shape',
    'thickness',
    'plunge',
    'grade',
    'depth',
    'rmr_ore',
    'rss_ore',
    'rmr_hw',
    'rss_hw',
    'rmr_fw',
    'rss_fw',
  ];

  for (const key of keys) {
    const value = params.get(key);
    if (value) {
      inputs[key] = value;
    }
  }

  return inputs;
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score <= -49) return 'text-red-600 bg-red-50';
  if (score <= 0) return 'text-orange-600 bg-orange-50';
  if (score <= 2) return 'text-yellow-600 bg-yellow-50';
  if (score <= 4) return 'text-green-600 bg-green-50';
  return 'text-emerald-600 bg-emerald-50';
}

/**
 * Get rank badge color
 */
export function getRankColor(rank: number): string {
  if (rank === 1) return 'bg-yellow-400 text-yellow-900';
  if (rank === 2) return 'bg-gray-300 text-gray-800';
  if (rank === 3) return 'bg-amber-600 text-amber-50';
  return 'bg-mining-100 text-mining-800';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a simple hash for cache busting
 */
export function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

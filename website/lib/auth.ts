/**
 * Centralized auth utilities for StoneAI dashboard.
 * Single source of truth — no more duplicate getAuth() in every page.
 */

export interface AuthState {
  token: string;
  email: string;
  balanceUsd?: number;
  plan?: string;
}

export function getAuth(): AuthState | null {
  try {
    const s = localStorage.getItem("stone_auth");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

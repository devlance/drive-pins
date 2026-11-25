import { DriveAccountInfo } from '../types';

/**
 * Extracts account index and key from a Google Drive URL or current window location.
 */
export function getAccountFromUrl(url: string = window.location.href): DriveAccountInfo {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/u\/(\d+)\//);
    const index = match ? parseInt(match[1], 10) : 0;
    return {
      accountIndex: index,
      accountKey: `u${index}`,
    };
  } catch {
    return {
      accountIndex: 0,
      accountKey: 'u0',
    };
  }
}

/**
 * Attempts to extract the active Google user's email from Drive's DOM.
 */
export function getAccountEmailFromDOM(): string | undefined {
  if (typeof document === 'undefined') return undefined;

  // 1. Check account profile button aria-label (often: "Google Account: Name (email@domain.com)")
  const profileElements = document.querySelectorAll<HTMLElement>(
    'header a[href*="SignOutOptions"], header button[aria-label*="@"], div[aria-label*="@"]'
  );

  for (const el of profileElements) {
    const label = el.getAttribute('aria-label') || el.title || '';
    const emailMatch = label.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) return emailMatch[1];
  }

  return undefined;
}

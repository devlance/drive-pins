import { PinItem, DriveItemType } from '../types';
import { getAccountFromUrl } from './account';

export interface ExtractedDriveItem {
  id: string;
  title: string;
  type: DriveItemType;
  mimeType?: string;
  url: string;
  color?: string;
}

const DRIVE_ID_REGEX = /^[a-zA-Z0-9_-]{15,60}$/;

/**
 * Validates that a URL is an HTTPS Google Drive or Google Docs/Sheets/Slides/Forms URL.
 */
export function isSafeDriveUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'drive.google.com' || parsed.hostname === 'docs.google.com')
    );
  } catch {
    return false;
  }
}

/**
 * Extracts Drive ID from a URL or string.
 */
export function extractDriveId(str: string): string | null {
  if (!str) return null;

  const folderMatch = str.match(/\/(?:folders|shared-drives)\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  const fileMatch = str.match(/\/(?:file\/d|document\/d|spreadsheets\/d|presentation\/d|forms\/d)\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  const genericIdMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (genericIdMatch) return genericIdMatch[1];

  return null;
}

/**
 * Robustly extracts the Drive ID from an element or its descendants/ancestors.
 */
export function extractDriveIdFromElement(el: HTMLElement): string | null {
  // 1. Direct links inside el or el itself
  const links = [el, ...Array.from(el.querySelectorAll<HTMLElement>('a[href]'))];
  for (const link of links) {
    const href = (link as HTMLAnchorElement).href || link.getAttribute('href') || '';
    const id = extractDriveId(href);
    if (id) return id;
  }

  // 2. Helper to check attributes on a single node
  const checkNode = (node: HTMLElement): string | null => {
    // Known specific ID attributes first
    const directAttrs = ['data-id', 'data-item-id', 'data-target-id', 'data-entry-id', 'data-file-id', 'data-folder-id'];
    for (const attr of directAttrs) {
      const val = node.getAttribute(attr);
      if (val && DRIVE_ID_REGEX.test(val) && !val.startsWith('drive-pins')) {
        return val;
      }
    }

    // Check all data-* and id attributes
    for (const attr of node.getAttributeNames()) {
      if (attr.startsWith('data-') || attr === 'id') {
        const val = node.getAttribute(attr);
        if (val && DRIVE_ID_REGEX.test(val) && !val.includes(' ') && !val.startsWith('drive-pins')) {
          return val;
        }
      }

      // Check jsdata, jslog, data-target
      if (attr === 'jsdata' || attr === 'jslog' || attr === 'data-target') {
        const val = node.getAttribute(attr) || '';
        const match = val.match(/([a-zA-Z0-9_-]{15,50})/);
        if (match && !match[1].startsWith('drive-pins')) {
          return match[1];
        }
      }
    }
    return null;
  };

  // Check el itself
  let found = checkNode(el);
  if (found) return found;

  // Check ancestors up to 5 levels (e.g. card container, table row)
  let curr: HTMLElement | null = el.parentElement;
  let depth = 0;
  while (curr && depth < 5) {
    found = checkNode(curr);
    if (found) return found;
    curr = curr.parentElement;
    depth++;
  }

  // Check children
  for (const child of el.querySelectorAll<HTMLElement>('*')) {
    found = checkNode(child);
    if (found) return found;
  }

  // Fallback: derive stable ID from title if no ID attribute found
  const title = el.getAttribute('aria-label') || el.textContent?.trim();
  if (title) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
    return `item_${slug}`;
  }

  return null;
}

export function cleanTitle(raw: string): string {
  if (!raw) return '';
  let text = raw.replace(/\s+/g, ' ').trim();

  // Remove trailing " - Google Drive" or ", Google Drive"
  text = text.replace(/[\s,–—-]+Google Drive$/i, '').trim();

  // 1. Check for comma / dash / separator followed by any type description
  // e.g. ", Google Drive Folder", ", Folder", ", Google Docs", ", PDF document", " - Folder"
  const commaTypeRegex = /[,–—]\s*(?:Google Drive\s+)?(?:Google\s+(?:Docs?|Sheets?|Slides?|Forms?|Drawings?|Sites?|Jamboard|Vids?|Apps Script|Documents?|Spreadsheets?|Presentations?)|Microsoft\s+(?:Word|Excel|PowerPoint)(?:\s+(?:Document|Spreadsheet|Presentation))?|(?:Shared\s+)?(?:Folder|Shared\s+drive|Document|Spreadsheet|Presentation|Form|Drawing|Site|Shortcut|File|Archive|Image|Video|Audio)|(?:PDF|Word|Excel|PowerPoint|CSV|Text|Zip|Compressed|PNG|JPEG|JPG|GIF|SVG|MP4|MP3)\s*(?:document|spreadsheet|presentation|archive|image|video|audio|file)?)\s*$/i;

  // 2. Multi-word Google type suffixes without comma
  // e.g. " Google Drive Folder", " Google Docs", " Google Sheets", " Google Slides", " Google Forms", " Google Document", " Google Spreadsheet"
  const googleTypeRegex = /\s+(?:Google Drive\s+(?:Folder|Shared drive|Document|Spreadsheet|Presentation|Form|Drawing|Site|File|Shortcut)|Google\s+(?:Docs?|Sheets?|Slides?|Forms?|Drawings?|Sites?|Jamboard|Vids?|Apps Script|Documents?|Spreadsheets?|Presentations?|Forms?)|Microsoft\s+(?:Word|Excel|PowerPoint)(?:\s+(?:Document|Spreadsheet|Presentation))?|(?:PDF|Word|Excel|PowerPoint|CSV|Text|Zip|Compressed|PNG|JPEG|JPG|GIF|SVG|MP4|MP3)\s+(?:document|spreadsheet|presentation|archive|image|video|audio|file))\s*$/i;

  // 3. Generic type suffix without comma (e.g. " Folder", " folder", " Shared Drive", " PDF")
  const genericTypeRegex = /\s+(?:Shared drive|Shared folder|Folder|Document|Spreadsheet|Presentation|Form|Drawing|Shortcut|File|PDF)\s*$/i;

  let cleaned = text;
  if (commaTypeRegex.test(cleaned)) {
    cleaned = cleaned.replace(commaTypeRegex, '').trim();
  } else if (googleTypeRegex.test(cleaned)) {
    cleaned = cleaned.replace(googleTypeRegex, '').trim();
  } else if (genericTypeRegex.test(cleaned)) {
    const candidate = cleaned.replace(genericTypeRegex, '').trim();
    if (candidate.length > 0) {
      cleaned = candidate;
    }
  }

  // Fallback: don't return an empty string if removing the type emptied it out completely
  return cleaned.length > 0 ? cleaned : text;
}

/**
 * Extracts Title from an element.
 */
export function extractTitleFromElement(el: HTMLElement, id: string): string {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.drive-pins-action-btn, button, [role="button"], svg').forEach(n => n.remove());

  const titleSelectors = [
    '[data-target="name"]',
    '[data-tooltip]',
    'span[dir="auto"]',
    'div[role="gridcell"] span',
    'div[role="row"] span',
  ];

  for (const sel of titleSelectors) {
    const found = clone.querySelector<HTMLElement>(sel);
    if (found) {
      const text = found.getAttribute('data-tooltip') ||
                   found.getAttribute('aria-label') ||
                   found.textContent?.trim();
      if (text && text.length > 1 && !text.toLowerCase().includes('more actions')) {
        return cleanTitle(text);
      }
    }
  }

  const elLabel = el.getAttribute('aria-label') || '';
  if (elLabel && !elLabel.toLowerCase().includes('more actions')) {
    return cleanTitle(elLabel);
  }

  const text = clone.textContent?.trim();
  if (text) {
    const firstLine = text.split('\n')[0].trim();
    if (firstLine && !firstLine.toLowerCase().includes('more actions')) {
      return cleanTitle(firstLine);
    }
  }

  return 'Item ' + id.slice(0, 6);
}

/**
 * Scans an element to extract item metadata.
 */
export function extractItemFromElement(el: HTMLElement): ExtractedDriveItem | null {
  const id = extractDriveIdFromElement(el);
  if (!id) return null;

  const title = extractTitleFromElement(el, id);

  // Determine Type
  let type: DriveItemType = 'file';
  const label = (el.getAttribute('aria-label') || '').toLowerCase();
  const hasFolderIcon = el.querySelector('svg[aria-label*="folder" i], svg[data-icon="folder"]') !== null;
  const isInsideSuggestedFolders = el.closest('[aria-label*="Suggested folders" i]') !== null;

  if (el.querySelector('a[href*="/shared-drives/"]') || label.includes('shared drive')) {
    type = 'shared-drive';
  } else if (
    el.querySelector('a[href*="/folders/"]') ||
    hasFolderIcon ||
    isInsideSuggestedFolders ||
    el.getAttribute('data-type') === 'folder' ||
    label.includes('folder') ||
    el.querySelector('[data-target="folder"], [aria-label*="folder" i]') !== null
  ) {
    type = 'folder';
  }

  // Construct URL
  const accountInfo = getAccountFromUrl();
  const prefix = accountInfo.accountIndex > 0 ? `/drive/u/${accountInfo.accountIndex}` : '/drive';
  let url = '';
  if (type === 'folder') {
    url = `https://drive.google.com${prefix}/folders/${id}`;
  } else if (type === 'shared-drive') {
    url = `https://drive.google.com${prefix}/shared-drives/${id}`;
  } else {
    url = `https://drive.google.com/file/d/${id}/view`;
  }

  // Extract Folder Color
  let color: string | undefined;
  if (type === 'folder') {
    const svgs = el.querySelectorAll<SVGElement>('svg path, svg');
    for (const svg of svgs) {
      const fill = svg.getAttribute('fill') || (svg as unknown as HTMLElement).style?.fill;
      if (fill && fill !== 'currentColor' && fill !== 'none' && fill !== '#5f6368' && fill !== 'rgb(95, 99, 104)') {
        color = fill;
        break;
      }
    }
  }

  // Determine mimeType
  let mimeType: string | undefined;
  if (type === 'file') {
    const textContext = [
      el.getAttribute('aria-label') || '',
      el.textContent || '',
      ...Array.from(el.querySelectorAll('[aria-label], [data-tooltip], [data-type]')).map(
        n => (n.getAttribute('aria-label') || '') + ' ' + (n.getAttribute('data-tooltip') || '') + ' ' + (n.getAttribute('data-type') || '')
      )
    ].join(' ').toLowerCase();

    const linkHref = el.querySelector('a[href]')?.getAttribute('href')?.toLowerCase() || '';

    const hasGreenSvg = el.querySelector('svg[fill="#0F9D58"], svg[fill="#188038"], svg[fill="#34A853"], path[fill="#0F9D58"], path[fill="#188038"], path[fill="#34A853"]') !== null;
    const hasBlueSvg = el.querySelector('svg[fill="#4285F4"], svg[fill="#1a73e8"], path[fill="#4285F4"], path[fill="#1a73e8"]') !== null;
    const hasYellowSvg = el.querySelector('svg[fill="#F4B400"], svg[fill="#FBBC04"], svg[fill="#f29900"], path[fill="#F4B400"], path[fill="#FBBC04"]') !== null;
    const hasPurpleSvg = el.querySelector('svg[fill="#7248B9"], svg[fill="#a142f4"], path[fill="#7248B9"], path[fill="#a142f4"]') !== null;
    const hasRedSvg = el.querySelector('svg[fill="#EA4335"], svg[fill="#d93025"], path[fill="#EA4335"], path[fill="#d93025"]') !== null;

    if (
      textContext.includes('spreadsheet') ||
      textContext.includes('google sheet') ||
      textContext.includes('excel') ||
      hasGreenSvg ||
      linkHref.includes('/spreadsheets/') ||
      title.endsWith('.gsheet') ||
      title.endsWith('.xlsx') ||
      title.endsWith('.csv')
    ) {
      mimeType = 'application/vnd.google-apps.spreadsheet';
    } else if (
      textContext.includes('google doc') ||
      textContext.includes('google document') ||
      textContext.includes('word') ||
      hasBlueSvg ||
      linkHref.includes('/document/') ||
      title.endsWith('.gdoc') ||
      title.endsWith('.docx')
    ) {
      mimeType = 'application/vnd.google-apps.document';
    } else if (
      textContext.includes('presentation') ||
      textContext.includes('google slide') ||
      textContext.includes('powerpoint') ||
      hasYellowSvg ||
      linkHref.includes('/presentation/') ||
      title.endsWith('.gslides') ||
      title.endsWith('.pptx')
    ) {
      mimeType = 'application/vnd.google-apps.presentation';
    } else if (
      textContext.includes('form') ||
      textContext.includes('google form') ||
      hasPurpleSvg ||
      linkHref.includes('/forms/') ||
      title.endsWith('.gform')
    ) {
      mimeType = 'application/vnd.google-apps.form';
    } else if (
      textContext.includes('pdf') ||
      (hasRedSvg && (textContext.includes('document') || title.endsWith('.pdf'))) ||
      title.endsWith('.pdf')
    ) {
      mimeType = 'application/pdf';
    } else if (
      textContext.includes('image') ||
      /\.(png|jpe?g|gif|svg|webp|bmp)$/i.test(title)
    ) {
      mimeType = 'image/png';
    } else if (
      textContext.includes('video') ||
      /\.(mp4|mov|avi|mkv|webm)$/i.test(title)
    ) {
      mimeType = 'video/mp4';
    } else if (
      textContext.includes('audio') ||
      /\.(mp3|wav|ogg|m4a|flac)$/i.test(title)
    ) {
      mimeType = 'audio/mpeg';
    } else if (
      textContext.includes('archive') ||
      textContext.includes('zip') ||
      /\.(zip|rar|7z|tar|gz)$/i.test(title)
    ) {
      mimeType = 'application/zip';
    }
  }

  return {
    id,
    title,
    type,
    mimeType,
    url,
    color,
  };
}

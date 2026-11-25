// SVG icons designed in Google Material Design style matching Google Drive

const SAFE_COLOR_REGEX = /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/;

/**
 * Validates a CSS color string to prevent attribute injection into inline SVGs.
 */
export function sanitizeColor(color?: string): string {
  if (color && SAFE_COLOR_REGEX.test(color.trim())) {
    return color.trim();
  }
  return '#5f6368';
}

export const ICONS = {
  // Pushpin Outline (Unpinned state)
  pinOutline: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 17v5"/>
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 1 1-1 1 1 0 0 0 1-1V2H7v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z"/>
  </svg>`,

  // Pushpin Filled (Pinned state)
  pinFilled: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
  </svg>`,

  // Folder Icon (Drive Gray or custom folder color)
  folder: (color: string = '#5f6368') => `<svg viewBox="0 0 24 24" width="20" height="20" fill="${sanitizeColor(color)}">
    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
  </svg>`,

  // Shared Drive Icon
  sharedDrive: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#1a73e8">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>`,

  // Google Doc Icon (Docs Blue #4285F4)
  doc: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#4285F4">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
  </svg>`,

  // Google Sheet Icon (Sheets Green #0F9D58)
  sheet: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#0F9D58">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H5v-4h4v4zm0-6H5V7h4v4zm6 6h-4v-4h4v4zm0-6h-4V7h4v4zm4 6h-2v-4h2v4zm0-6h-2V7h2v4z"/>
  </svg>`,

  // Google Slide Icon (Slides Amber/Yellow #F4B400)
  slide: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#F4B400">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h10v7H7z"/>
  </svg>`,

  // Google Form Icon (Forms Purple #7248B9)
  form: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#7248B9">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>`,

  // PDF Document Icon (PDF Red #EA4335)
  pdf: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#EA4335">
    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v4zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zm4.5 2H15v-3h-1.5v3zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/>
  </svg>`,

  // Image File Icon (Coral #EA4335)
  image: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#EA4335">
    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
  </svg>`,

  // Video File Icon (Red #EA4335)
  video: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#EA4335">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
  </svg>`,

  // Audio File Icon (Blue #1A73E8)
  audio: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#1A73E8">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
  </svg>`,

  // Archive / Zip Icon (Gray #5f6368)
  archive: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#5f6368">
    <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10h-2v-2h2v2zm0-4h-2v-2h2v2zm-2-4V6h2v2h-2z"/>
  </svg>`,

  // Code / Text Script Icon (Gray #5f6368)
  code: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#5f6368">
    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
  </svg>`,

  // Generic File Icon (Standard Drive Neutral Gray #5f6368 - NOT red!)
  file: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#5f6368">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
  </svg>`,

  // Chevron Down / Expand
  chevronDown: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
  </svg>`,

  // Drag Handle (Grip)
  dragHandle: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
  </svg>`,

  // More Vertical (Menu)
  moreVert: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>`,

  // Edit / Rename Pencil
  edit: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>`,

  // Palette (Color Picker)
  palette: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>`,

  // Trash / Delete
  trash: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>`,

  // Search
  search: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>`,

  // External Link
  externalLink: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
  </svg>`
};

// Standard Drive 24-folder color palette
export const DRIVE_FOLDER_COLORS = [
  '#ac725e', '#d06b64', '#f83a22', '#fa573c', '#ff7537', '#ffad46',
  '#42d692', '#16a765', '#7bd148', '#b3dc6c', '#fbe983', '#fad165',
  '#92e1c0', '#9fe1e7', '#9fc6e7', '#4986e7', '#9a9cff', '#b99aff',
  '#c2c2c2', '#cabdbf', '#cca6ac', '#f691b2', '#cd74e6', '#a47ae2'
];

/**
 * Returns an appropriate SVG icon string based on item type, mimeType, title, and url.
 * Accurately matches native Google Drive icons and colors.
 */
export function getItemIcon(
  type: string,
  mimeType?: string,
  color?: string,
  title?: string,
  url?: string
): string {
  if (type === 'shared-drive') {
    return ICONS.sharedDrive;
  }
  if (type === 'folder') {
    return ICONS.folder(color || '#5f6368');
  }

  const mime = (mimeType || '').toLowerCase();
  const name = (title || '').toLowerCase();
  const link = (url || '').toLowerCase();

  // 1. Google Sheets / Excel / Spreadsheet (Green)
  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('sheet') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    name.endsWith('.csv') ||
    name.endsWith('.gsheet') ||
    link.includes('/spreadsheets/')
  ) {
    return ICONS.sheet;
  }

  // 2. Google Docs / Word / Document (Blue)
  if (
    mime.includes('document') ||
    mime.includes('word') ||
    mime.includes('gdoc') ||
    name.endsWith('.docx') ||
    name.endsWith('.doc') ||
    name.endsWith('.gdoc') ||
    link.includes('/document/')
  ) {
    return ICONS.doc;
  }

  // 3. Google Slides / PowerPoint / Presentation (Amber/Yellow)
  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    mime.includes('slide') ||
    name.endsWith('.pptx') ||
    name.endsWith('.ppt') ||
    name.endsWith('.gslides') ||
    link.includes('/presentation/')
  ) {
    return ICONS.slide;
  }

  // 4. Google Forms (Purple)
  if (
    mime.includes('form') ||
    link.includes('/forms/') ||
    name.endsWith('.gform')
  ) {
    return ICONS.form;
  }

  // 5. PDF Document (Red)
  if (
    mime.includes('pdf') ||
    name.endsWith('.pdf')
  ) {
    return ICONS.pdf;
  }

  // 6. Image (Coral/Red)
  if (
    mime.includes('image') ||
    /\.(png|jpe?g|gif|svg|webp|bmp|ico|tiff?)$/i.test(name)
  ) {
    return ICONS.image;
  }

  // 7. Video (Red)
  if (
    mime.includes('video') ||
    /\.(mp4|mov|avi|mkv|webm|wmv|flv|m4v)$/i.test(name)
  ) {
    return ICONS.video;
  }

  // 8. Audio (Blue)
  if (
    mime.includes('audio') ||
    /\.(mp3|wav|ogg|m4a|flac|aac|wma)$/i.test(name)
  ) {
    return ICONS.audio;
  }

  // 9. Zip / Archive (Gray)
  if (
    mime.includes('zip') ||
    mime.includes('archive') ||
    mime.includes('compressed') ||
    mime.includes('tar') ||
    /\.(zip|rar|7z|tar|gz|bz2|tgz)$/i.test(name)
  ) {
    return ICONS.archive;
  }

  // 10. Code / Script / Text (Gray)
  if (
    mime.includes('code') ||
    mime.includes('script') ||
    mime.includes('text') ||
    /\.(js|ts|jsx|tsx|py|html|css|json|xml|sh|java|cpp|c|go|rs|sql|txt|md)$/i.test(name)
  ) {
    return ICONS.code;
  }

  // Standard Google Drive Generic File (Neutral Gray #5f6368)
  return ICONS.file;
}

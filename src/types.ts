export type DriveItemType = 'folder' | 'shared-drive' | 'file' | 'shortcut';

export interface PinItem {
  id: string;                      // Drive unique ID
  title: string;                   // Drive native file/folder name
  aliasTitle?: string;             // User custom display name (overrides title if present)
  type: DriveItemType;
  mimeType?: string;
  url: string;                     // Full or relative navigation URL
  accountKey: string;              // Identifies account (e.g. 'u0', 'u1', or 'default')
  color?: string;                  // Drive folder color or custom color override
  emoji?: string;                  // Custom user emoji (e.g. '📁', '📊', '🔥')
  createdAt: number;
  order: number;
}

export interface ExtensionSettings {
  sidebarCollapsed: boolean;
  openFilesInNewTab: boolean;
}

export interface DriveAccountInfo {
  accountIndex: number;            // e.g. 0 for /u/0/
  accountKey: string;              // e.g. 'u0'
  email?: string;
}

export type StorageChangeCallback = (pins: PinItem[], accountKey: string) => void;

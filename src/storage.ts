import { PinItem, ExtensionSettings, StorageChangeCallback } from './types';
import { cleanTitle } from './utils/dom';

const STORAGE_PREFIX = 'drive_pins_';
const SETTINGS_KEY = 'drive_pins_settings';

const DEFAULT_SETTINGS: ExtensionSettings = {
  sidebarCollapsed: false,
  openFilesInNewTab: true,
};

function getStorageKey(accountKey: string): string {
  return `${STORAGE_PREFIX}${accountKey}`;
}

export class StorageService {
  /**
   * Retrieves all pins for a specific accountKey (e.g. 'u0', 'u1').
   */
  static async getPins(accountKey: string): Promise<PinItem[]> {
    const key = getStorageKey(accountKey);
    let pins: PinItem[] = [];
    try {
      const result = await chrome.storage.sync.get(key);
      pins = (result[key] as PinItem[]) || [];
    } catch (err) {
      console.warn('[DrivePins] Error reading from sync storage, trying local:', err);
      const localResult = await chrome.storage.local.get(key);
      pins = (localResult[key] as PinItem[]) || [];
    }

    // Ensure titles are clean of any trailing file/folder type suffixes
    pins.forEach(p => {
      if (p.title) {
        p.title = cleanTitle(p.title);
      }
    });

    return pins.sort((a, b) => a.order - b.order);
  }

  /**
   * Saves the entire list of pins for an account.
   */
  static async savePins(accountKey: string, pins: PinItem[]): Promise<void> {
    const key = getStorageKey(accountKey);
    // Ensure orders are sequential
    const orderedPins = pins.map((pin, index) => ({
      ...pin,
      order: index,
    }));

    try {
      await chrome.storage.sync.set({ [key]: orderedPins });
      // Keep local copy updated as well for offline / fallback
      await chrome.storage.local.set({ [key]: orderedPins });
    } catch (err) {
      console.warn('[DrivePins] Failed to save to sync storage (quota exceeded?), saving to local:', err);
      await chrome.storage.local.set({ [key]: orderedPins });
    }
  }

  /**
   * Adds a new pin or updates if already exists.
   */
  static async addPin(pin: PinItem): Promise<void> {
    if (pin.title) {
      pin.title = cleanTitle(pin.title);
    }
    const pins = await this.getPins(pin.accountKey);
    const existingIndex = pins.findIndex(p => p.id === pin.id);

    if (existingIndex >= 0) {
      // Update existing
      pins[existingIndex] = {
        ...pins[existingIndex],
        ...pin,
        order: pins[existingIndex].order, // Preserve position
      };
    } else {
      // Add to beginning of list
      pins.unshift({
        ...pin,
        order: 0,
      });
      // Re-index remaining
      pins.forEach((p, idx) => {
        p.order = idx;
      });
    }

    await this.savePins(pin.accountKey, pins);
  }

  /**
   * Removes a pin by its Drive ID.
   */
  static async removePin(id: string, accountKey: string): Promise<void> {
    const pins = await this.getPins(accountKey);
    const filtered = pins.filter(p => p.id !== id);
    await this.savePins(accountKey, filtered);
  }

  /**
   * Updates fields of a specific pin (e.g. aliasTitle, color, emoji).
   */
  static async updatePin(
    id: string,
    accountKey: string,
    updates: Partial<Omit<PinItem, 'id' | 'accountKey'>>
  ): Promise<PinItem | null> {
    const pins = await this.getPins(accountKey);
    const pin = pins.find(p => p.id === id);
    if (!pin) return null;

    Object.assign(pin, updates);
    await this.savePins(accountKey, pins);
    return pin;
  }

  /**
   * Reorders pins according to an array of pin IDs.
   */
  static async reorderPins(accountKey: string, orderedIds: string[]): Promise<void> {
    const pins = await this.getPins(accountKey);
    const pinMap = new Map(pins.map(p => [p.id, p]));
    const reordered: PinItem[] = [];

    for (const id of orderedIds) {
      const pin = pinMap.get(id);
      if (pin) {
        reordered.push(pin);
        pinMap.delete(id);
      }
    }

    // Append any pins not in the ordered list at the end
    for (const remaining of pinMap.values()) {
      reordered.push(remaining);
    }

    await this.savePins(accountKey, reordered);
  }

  /**
   * Checks whether a specific Drive ID is pinned.
   */
  static async isPinned(id: string, accountKey: string): Promise<boolean> {
    const pins = await this.getPins(accountKey);
    return pins.some(p => p.id === id);
  }

  /**
   * Retrieves extension settings.
   */
  static async getSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.sync.get(SETTINGS_KEY);
      const settings = (result[SETTINGS_KEY] as Partial<ExtensionSettings>) || {};
      return { ...DEFAULT_SETTINGS, ...settings };
    } catch {
      const localResult = await chrome.storage.local.get(SETTINGS_KEY);
      const settings = (localResult[SETTINGS_KEY] as Partial<ExtensionSettings>) || {};
      return { ...DEFAULT_SETTINGS, ...settings };
    }
  }

  /**
   * Saves partial settings updates.
   */
  static async saveSettings(updates: Partial<ExtensionSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    await chrome.storage.sync.set({ [SETTINGS_KEY]: updated });
    await chrome.storage.local.set({ [SETTINGS_KEY]: updated });
  }

  /**
   * Subscribes to changes in pins storage.
   */
  static onPinsChanged(callback: StorageChangeCallback): () => void {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== 'sync' && areaName !== 'local') return;

      for (const [key, change] of Object.entries(changes)) {
        if (key.startsWith(STORAGE_PREFIX)) {
          const accountKey = key.replace(STORAGE_PREFIX, '');
          const newPins: PinItem[] = (change.newValue as PinItem[]) || [];
          callback(newPins, accountKey);
        }
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
}

import { DriveObserver } from './drive-observer';
import { SidebarPinnedSection } from './sidebar-pinned';
import { StorageService } from '../storage';
import { getAccountFromUrl } from '../utils/account';
import { extractDriveId, extractItemFromElement, cleanTitle } from '../utils/dom';
import { showToast } from './menu-pin-item';
import { PinItem } from '../types';

console.log('[DrivePins] Extension content script initialized on drive.google.com');

const sidebar = new SidebarPinnedSection();
const observer = new DriveObserver(() => {
  sidebar.ensureInjected();
});

// Initialize sidebar and observer
sidebar.init().then(() => {
  observer.start();
});

// Track last right-clicked element for context menu pinning
let lastRightClickedElement: HTMLElement | null = null;

document.addEventListener('contextmenu', (e) => {
  lastRightClickedElement = e.target as HTMLElement;
}, true);

// Listen for messages from background script or popup
chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (message.action === 'pin-current-page') {
    handlePinCurrentPage().then((result) => {
      sendResponse(result);
    });
    return true; // Keep channel open for async response
  }

  if (message.action === 'get-current-page-info') {
    sendResponse(getCurrentPageInfo());
    return false;
  }

  if (message.action === 'context-menu-pin') {
    handleContextMenuPin();
    sendResponse({ success: true });
    return false;
  }
});

/**
 * Pins the currently active folder or page.
 */
async function handlePinCurrentPage(): Promise<{ success: boolean; pin?: PinItem; error?: string }> {
  const accountInfo = getAccountFromUrl();
  const currentUrl = window.location.href;
  const id = extractDriveId(currentUrl);

  if (!id) {
    showToast('Could not identify current folder to pin');
    return { success: false, error: 'No folder ID detected in current URL' };
  }

  // Derive title from document.title or breadcrumb
  let title = cleanTitle(document.title.replace(/\s*-\s*Google Drive$/i, '').trim());
  if (!title || title === 'Google Drive') {
    title = 'Folder ' + id.slice(0, 6);
  }

  const isSharedDrive = currentUrl.includes('/shared-drives/');
  const isFolder = currentUrl.includes('/folders/');
  const isSheet = currentUrl.includes('/spreadsheets/');
  const isDoc = currentUrl.includes('/document/');
  const isSlide = currentUrl.includes('/presentation/');
  const isForm = currentUrl.includes('/forms/');

  let itemType: PinItem['type'] = 'folder';
  let mimeType: string | undefined;

  if (isSharedDrive) {
    itemType = 'shared-drive';
  } else if (isFolder) {
    itemType = 'folder';
  } else if (isSheet) {
    itemType = 'file';
    mimeType = 'application/vnd.google-apps.spreadsheet';
  } else if (isDoc) {
    itemType = 'file';
    mimeType = 'application/vnd.google-apps.document';
  } else if (isSlide) {
    itemType = 'file';
    mimeType = 'application/vnd.google-apps.presentation';
  } else if (isForm) {
    itemType = 'file';
    mimeType = 'application/vnd.google-apps.form';
  } else if (currentUrl.includes('/file/d/')) {
    itemType = 'file';
  }

  const isPinned = await StorageService.isPinned(id, accountInfo.accountKey);

  if (isPinned) {
    await StorageService.removePin(id, accountInfo.accountKey);
    showToast(`Unpinned "${title}"`);
    return { success: true };
  } else {
    const newPin: PinItem = {
      id,
      title,
      type: itemType,
      mimeType,
      url: currentUrl,
      accountKey: accountInfo.accountKey,
      createdAt: Date.now(),
      order: 0,
    };
    await StorageService.addPin(newPin);
    showToast(`Pinned "${title}" to sidebar`);
    return { success: true, pin: newPin };
  }
}

/**
 * Returns basic info about the currently viewed folder in Drive.
 */
function getCurrentPageInfo() {
  const currentUrl = window.location.href;
  const id = extractDriveId(currentUrl);
  let title = cleanTitle(document.title.replace(/\s*-\s*Google Drive$/i, '').trim());
  if (!title || title === 'Google Drive') {
    title = id ? `Folder ${id.slice(0, 6)}` : 'Google Drive';
  }

  return {
    id,
    title,
    url: currentUrl,
    account: getAccountFromUrl(),
  };
}

/**
 * Handles context menu pin action from background script.
 */
async function handleContextMenuPin(): Promise<void> {
  if (lastRightClickedElement) {
    const row = lastRightClickedElement.closest<HTMLElement>(
      '[role="row"], [role="gridcell"], [data-target="item"], div[role="button"]:not([aria-haspopup="menu"])'
    );
    if (row) {
      const itemData = extractItemFromElement(row);
      if (itemData && itemData.id) {
        const accountInfo = getAccountFromUrl();
        const isPinned = await StorageService.isPinned(itemData.id, accountInfo.accountKey);
        const safeTitle = cleanTitle(itemData.title);
        if (isPinned) {
          await StorageService.removePin(itemData.id, accountInfo.accountKey);
          showToast(`Unpinned "${safeTitle}"`);
        } else {
          await StorageService.addPin({
            id: itemData.id,
            title: safeTitle,
            type: itemData.type,
            mimeType: itemData.mimeType,
            url: itemData.url,
            accountKey: accountInfo.accountKey,
            createdAt: Date.now(),
            order: 0,
          });
          showToast(`Pinned "${safeTitle}" to sidebar`);
        }
        return;
      }
    }
  }

  // Fallback to pinning current folder
  await handlePinCurrentPage();
}

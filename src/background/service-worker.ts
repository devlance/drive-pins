/**
 * Background Service Worker for Drive Pins (Manifest V3)
 */

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item for Google Drive tabs
  chrome.contextMenus.create({
    id: 'drive-pins-context-toggle',
    title: 'Pin / Unpin in Drive Pins',
    contexts: ['page', 'link'],
    documentUrlPatterns: ['https://drive.google.com/*'],
  });
  console.log('[DrivePins] Service worker installed and context menu created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
  if (info.menuItemId === 'drive-pins-context-toggle' && tab?.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'context-menu-pin' });
    } catch (err) {
      console.warn('[DrivePins] Failed to dispatch context menu action to tab:', err);
    }
  }
});

import { PinItem } from '../types';
import { StorageService } from '../storage';
import { ICONS, getItemIcon } from '../utils/icons';
import { getAccountFromUrl } from '../utils/account';
import { cleanTitle } from '../utils/dom';

let currentAccountKey = 'u0';
let allPins: PinItem[] = [];
let searchQuery = '';
let draggedPinId: string | null = null;
let activeTab: chrome.tabs.Tab | null = null;

// DOM Elements
const accountSelect = document.getElementById('account-select') as HTMLSelectElement;
const pinCurrentBtn = document.getElementById('pin-current-btn') as HTMLButtonElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const searchClearBtn = document.getElementById('search-clear-btn') as HTMLButtonElement;
const pinsList = document.getElementById('pins-list') as HTMLElement;
const emptyState = document.getElementById('empty-state') as HTMLElement;
const pinCount = document.getElementById('pin-count') as HTMLElement;

document.addEventListener('DOMContentLoaded', async () => {
  await initActiveTab();
  setupEventListeners();
  await loadPins();
});

/**
 * Checks current active tab to configure account and Pin Current button.
 */
async function initActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab || null;

  if (activeTab?.url && activeTab.url.includes('drive.google.com')) {
    const accountInfo = getAccountFromUrl(activeTab.url);
    currentAccountKey = accountInfo.accountKey;

    // Ensure option exists in dropdown
    let exists = false;
    for (let i = 0; i < accountSelect.options.length; i++) {
      if (accountSelect.options[i].value === currentAccountKey) {
        accountSelect.selectedIndex = i;
        exists = true;
        break;
      }
    }
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = currentAccountKey;
      opt.textContent = `Account ${accountInfo.accountIndex + 1}`;
      accountSelect.appendChild(opt);
      accountSelect.value = currentAccountKey;
    }

    pinCurrentBtn.disabled = false;
    pinCurrentBtn.title = 'Pin current folder or file';
  } else {
    // Not on Google Drive
    pinCurrentBtn.disabled = true;
    pinCurrentBtn.title = 'Navigate to drive.google.com to pin the current page';
    currentAccountKey = accountSelect.value || 'u0';
  }
}

function setupEventListeners(): void {
  // Account switch
  accountSelect.addEventListener('change', async () => {
    currentAccountKey = accountSelect.value;
    await loadPins();
  });

  // Pin Current Page button
  pinCurrentBtn.addEventListener('click', async () => {
    if (!activeTab?.id) return;

    try {
      const response = await chrome.tabs.sendMessage(activeTab.id, { action: 'pin-current-page' });
      if (response?.success) {
        await loadPins();
      }
    } catch (err) {
      console.warn('[DrivePins] Could not communicate with content script:', err);
    }
  });

  // Search input
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.toLowerCase().trim();
    searchClearBtn.style.display = searchQuery ? 'block' : 'none';
    renderPins();
  });

  // Clear search
  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClearBtn.style.display = 'none';
    renderPins();
    searchInput.focus();
  });
}

/**
 * Loads pins for the selected account from storage.
 */
async function loadPins(): Promise<void> {
  allPins = await StorageService.getPins(currentAccountKey);
  renderPins();
}

/**
 * Renders the pins list according to search query.
 */
function renderPins(): void {
  const filtered = searchQuery
    ? allPins.filter(p =>
        (p.aliasTitle && p.aliasTitle.toLowerCase().includes(searchQuery)) ||
        p.title.toLowerCase().includes(searchQuery) ||
        p.type.toLowerCase().includes(searchQuery)
      )
    : allPins;

  pinsList.innerHTML = '';
  pinCount.textContent = `${allPins.length} ${allPins.length === 1 ? 'pin' : 'pins'}`;

  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
    if (searchQuery) {
      emptyState.querySelector('.empty-title')!.textContent = 'No matching pins';
      emptyState.querySelector('.empty-desc')!.textContent = `No pins match "${searchQuery}"`;
    } else {
      emptyState.querySelector('.empty-title')!.textContent = 'No pinned items yet';
      emptyState.querySelector('.empty-desc')!.textContent = 'Open Google Drive and click the pin icon on any file or folder to add it here.';
    }
    return;
  }

  emptyState.style.display = 'none';

  for (const pin of filtered) {
    const row = createPinRow(pin);
    pinsList.appendChild(row);
  }
}

/**
 * Creates an individual pin row in the popup list.
 */
function createPinRow(pin: PinItem): HTMLElement {
  const row = document.createElement('div');
  row.className = 'pin-row';
  row.setAttribute('data-id', pin.id);
  row.setAttribute('draggable', searchQuery ? 'false' : 'true');

  // Left side: Grip, Icon, Details
  const left = document.createElement('div');
  left.className = 'pin-row-left';

  // Drag handle
  const grip = document.createElement('span');
  grip.className = 'drag-grip';
  grip.innerHTML = ICONS.dragHandle;
  grip.title = 'Drag to reorder';

  // Icon
  const icon = document.createElement('span');
  icon.className = 'pin-icon';
  if (pin.emoji) {
    icon.innerHTML = `<span style="font-size: 16px;">${pin.emoji}</span>`;
  } else {
    icon.innerHTML = getItemIcon(pin.type, pin.mimeType, pin.color, pin.title, pin.url);
  }

  // Details
  const details = document.createElement('div');
  details.className = 'pin-details';

  const title = document.createElement('span');
  title.className = 'pin-title';
  title.textContent = pin.aliasTitle || cleanTitle(pin.title);

  const subtitle = document.createElement('span');
  subtitle.className = 'pin-subtitle';
  subtitle.textContent = pin.aliasTitle ? `Original: ${cleanTitle(pin.title)}` : (pin.type === 'shared-drive' ? 'Shared Drive' : pin.type);

  details.appendChild(title);
  details.appendChild(subtitle);

  left.appendChild(grip);
  left.appendChild(icon);
  left.appendChild(details);

  // Click to open
  left.addEventListener('click', async () => {
    await openPin(pin);
  });

  // Right actions: Unpin
  const actions = document.createElement('div');
  actions.className = 'pin-actions';

  const unpinBtn = document.createElement('button');
  unpinBtn.type = 'button';
  unpinBtn.className = 'icon-btn';
  unpinBtn.innerHTML = ICONS.trash;
  unpinBtn.title = 'Unpin';
  unpinBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await StorageService.removePin(pin.id, currentAccountKey);
    await loadPins();
  });

  actions.appendChild(unpinBtn);

  row.appendChild(left);
  row.appendChild(actions);

  // Drag and drop reordering
  if (!searchQuery) {
    setupPopupDragAndDrop(row, pin);
  }

  return row;
}

/**
 * Handles opening a pinned item from the popup.
 */
async function openPin(pin: PinItem): Promise<void> {
  if (activeTab?.url && activeTab.url.includes('drive.google.com') && (pin.type === 'folder' || pin.type === 'shared-drive')) {
    // If user is already on Drive, navigate current tab
    await chrome.tabs.update(activeTab.id!, { url: pin.url });
    window.close();
  } else {
    // Otherwise open in a new tab
    await chrome.tabs.create({ url: pin.url });
    window.close();
  }
}

/**
 * Popup Drag-and-drop handler.
 */
function setupPopupDragAndDrop(row: HTMLElement, pin: PinItem): void {
  row.addEventListener('dragstart', (e) => {
    draggedPinId = pin.id;
    row.classList.add('dragging');
    e.dataTransfer?.setData('text/plain', pin.id);
  });

  row.addEventListener('dragend', () => {
    row.classList.remove('dragging');
    draggedPinId = null;
    document.querySelectorAll('.pin-row').forEach(el => {
      (el as HTMLElement).style.borderTop = '';
      (el as HTMLElement).style.borderBottom = '';
    });
  });

  row.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!draggedPinId || draggedPinId === pin.id) return;

    const rect = row.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;

    if (e.clientY < mid) {
      row.style.borderTop = '2px solid #1a73e8';
      row.style.borderBottom = '';
    } else {
      row.style.borderTop = '';
      row.style.borderBottom = '2px solid #1a73e8';
    }
  });

  row.addEventListener('dragleave', () => {
    row.style.borderTop = '';
    row.style.borderBottom = '';
  });

  row.addEventListener('drop', async (e) => {
    e.preventDefault();
    row.style.borderTop = '';
    row.style.borderBottom = '';

    if (!draggedPinId || draggedPinId === pin.id) return;

    const rect = row.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    const dropBefore = e.clientY < mid;

    const currentOrder = allPins.map(p => p.id);
    const dragIndex = currentOrder.indexOf(draggedPinId);
    if (dragIndex < 0) return;

    currentOrder.splice(dragIndex, 1);
    let targetIndex = currentOrder.indexOf(pin.id);
    if (!dropBefore) targetIndex += 1;
    currentOrder.splice(targetIndex, 0, draggedPinId);

    await StorageService.reorderPins(currentAccountKey, currentOrder);
    await loadPins();
  });
}

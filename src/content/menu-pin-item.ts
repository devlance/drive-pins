import { PinItem } from '../types';
import { StorageService } from '../storage';
import { ICONS } from '../utils/icons';
import { ExtractedDriveItem, cleanTitle } from '../utils/dom';
import { getAccountFromUrl } from '../utils/account';

const MENU_ITEM_CLASS = 'drive-pins-menu-item';

/**
 * Checks whether an element is genuinely rendered and visible on screen.
 */
export function isElementVisible(el: HTMLElement): boolean {
  if (!el || !document.body.contains(el)) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;

  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }

  const rect = el.getBoundingClientRect();
  if (rect.width <= 20 || rect.height <= 20) return false;

  // Must be visible within or near viewport boundaries
  if (
    rect.bottom < 0 ||
    rect.right < 0 ||
    rect.top > window.innerHeight ||
    rect.left > window.innerWidth
  ) {
    return false;
  }

  return true;
}

/**
 * Finds the currently visible Drive item context menu (from triple dot or right-click).
 */
export function findVisibleItemMenu(): HTMLElement | null {
  const menus = document.querySelectorAll<HTMLElement>('[role="menu"]');
  for (const m of Array.from(menus)) {
    if (!isElementVisible(m)) continue;

    const items = m.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'
    );
    if (items.length < 2) continue;

    const menuText = m.textContent?.toLowerCase() || '';
    const looksLikeItemMenu =
      menuText.includes('download') ||
      menuText.includes('rename') ||
      menuText.includes('organize') ||
      menuText.includes('starred') ||
      menuText.includes('share') ||
      menuText.includes('trash') ||
      menuText.includes('information') ||
      menuText.includes('details') ||
      menuText.includes('open with') ||
      menuText.includes('move to trash');

    if (looksLikeItemMenu) {
      return m;
    }
  }
  return null;
}

/**
 * Injects "Pin to sidebar" / "Unpin from sidebar" into the given menu element.
 */
export async function injectPinIntoMenu(
  menuEl: HTMLElement,
  itemData: ExtractedDriveItem
): Promise<void> {
  // 1. Prune accidental duplicates
  const existing = menuEl.querySelectorAll<HTMLElement>(`.${MENU_ITEM_CLASS}`);
  if (existing.length > 1) {
    for (let i = 1; i < existing.length; i++) existing[i].remove();
    return;
  }
  if (existing.length === 1) return;

  // 2. Prevent concurrent injections on the same menu element
  if (menuEl.dataset.drivePinsInjecting === 'true') return;
  menuEl.dataset.drivePinsInjecting = 'true';

  try {
    const menuText = menuEl.textContent?.toLowerCase() || '';

    // If the menu explicitly indicates "folder information", refine the type to folder
    if (menuText.includes('folder information')) {
      itemData.type = 'folder';
      const accountInfo = getAccountFromUrl();
      const prefix = accountInfo.accountIndex > 0 ? `/drive/u/${accountInfo.accountIndex}` : '/drive';
      itemData.url = `https://drive.google.com${prefix}/folders/${itemData.id}`;
    } else if (menuText.includes('file information')) {
      itemData.type = 'file';
    }

    const accountInfo = getAccountFromUrl();
    const isPinned = await StorageService.isPinned(itemData.id, accountInfo.accountKey);

    // Double-check after async read
    if (menuEl.querySelector(`.${MENU_ITEM_CLASS}`)) return;

    const safeTitle = cleanTitle(itemData.title);

    // Build the menu item
    const menuItem = document.createElement('div');
    menuItem.className = `${MENU_ITEM_CLASS} drive-pins-item`;
    menuItem.setAttribute('role', 'menuitem');
    menuItem.setAttribute('tabindex', '-1');

    Object.assign(menuItem.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      height: '36px',
      padding: '0 16px',
      cursor: 'pointer',
      userSelect: 'none',
      fontFamily: 'Google Sans, Roboto, RobotoDraft, Helvetica, Arial, sans-serif',
      fontSize: '14px',
      fontWeight: '400',
      color: '#1f1f1f',
      transition: 'background-color 0.15s ease',
      boxSizing: 'border-box',
      width: '100%',
    });

    menuItem.addEventListener('mouseenter', () => {
      menuItem.style.backgroundColor = 'rgba(68, 71, 70, 0.08)';
    });
    menuItem.addEventListener('mouseleave', () => {
      menuItem.style.backgroundColor = 'transparent';
    });

    const iconSpan = document.createElement('span');
    Object.assign(iconSpan.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '20px',
      height: '20px',
      flexShrink: '0',
      color: isPinned ? '#1a73e8' : '#5f6368',
    });
    iconSpan.innerHTML = isPinned ? ICONS.pinFilled : ICONS.pinOutline;

    const labelSpan = document.createElement('span');
    labelSpan.style.flex = '1';
    labelSpan.textContent = isPinned ? 'Unpin from sidebar' : 'Pin to sidebar';

    menuItem.appendChild(iconSpan);
    menuItem.appendChild(labelSpan);

    // Click handler
    menuItem.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();

      const currentPinned = await StorageService.isPinned(itemData.id, accountInfo.accountKey);
      const nextPinned = !currentPinned;

      if (nextPinned) {
        const newPin: PinItem = {
          id: itemData.id,
          title: safeTitle,
          type: itemData.type,
          mimeType: itemData.mimeType,
          url: itemData.url,
          accountKey: accountInfo.accountKey,
          color: itemData.color,
          createdAt: Date.now(),
          order: 0,
        };
        await StorageService.addPin(newPin);
        showToast(`Pinned "${safeTitle}" to sidebar`);
      } else {
        await StorageService.removePin(itemData.id, accountInfo.accountKey);
        showToast(`Unpinned "${safeTitle}"`);
      }

      // Close the popup menu
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true })
      );
      setTimeout(() => {
        if (document.body.contains(menuEl)) {
          menuEl.style.display = 'none';
        }
      }, 50);
    });

    // Insertion placement: place right after 'Organize' or 'Starred' if present,
    // otherwise after 'Download', otherwise at the top of the menu
    let insertAnchor: HTMLElement | null = null;
    const currentItems = menuEl.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="presentation"]'
    );
    for (const it of Array.from(currentItems)) {
      const text = it.textContent?.toLowerCase() || '';
      if (text.includes('organize') || text.includes('starred')) {
        insertAnchor = it;
        break;
      }
    }
    if (!insertAnchor) {
      for (const it of Array.from(currentItems)) {
        const text = it.textContent?.toLowerCase() || '';
        if (text.includes('download')) {
          insertAnchor = it;
          break;
        }
      }
    }

    if (insertAnchor && insertAnchor.parentElement) {
      insertAnchor.insertAdjacentElement('afterend', menuItem);
    } else if (menuEl.firstElementChild) {
      menuEl.insertBefore(menuItem, menuEl.firstElementChild);
    } else {
      menuEl.appendChild(menuItem);
    }
  } finally {
    delete menuEl.dataset.drivePinsInjecting;
  }
}

/**
 * Finds the currently visible Drive context menu and injects into it.
 */
export async function injectPinIntoVisibleMenu(
  itemData: ExtractedDriveItem
): Promise<void> {
  const menuEl = findVisibleItemMenu();
  if (!menuEl) return;
  await injectPinIntoMenu(menuEl, itemData);
}

/**
 * In-page toast notification for instant feedback.
 */
export function showToast(message: string, duration: number = 2500): void {
  const existing = document.getElementById('drive-pins-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'drive-pins-toast';
  toast.textContent = message;

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    backgroundColor: '#323232',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: 'Google Sans, Roboto, RobotoDraft, Helvetica, Arial, sans-serif',
    boxShadow: '0 3px 8px rgba(0,0,0,0.26)',
    zIndex: '999999',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    opacity: '0',
    transform: 'translateY(10px)',
  });

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

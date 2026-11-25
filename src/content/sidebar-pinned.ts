import { PinItem } from '../types';
import { StorageService } from '../storage';
import { getAccountFromUrl } from '../utils/account';
import { ICONS, getItemIcon } from '../utils/icons';
import { PinModal } from './pin-modal';
import { showToast } from './menu-pin-item';
import { cleanTitle } from '../utils/dom';

const CONTAINER_ID = 'drive-pins-sidebar-container';

export class SidebarPinnedSection {
  private container: HTMLElement | null = null;
  private isCollapsed: boolean = false;
  private pins: PinItem[] = [];
  private draggedItemId: string | null = null;

  public async init(): Promise<void> {
    const settings = await StorageService.getSettings();
    this.isCollapsed = settings.sidebarCollapsed;

    // Listen to storage changes to update sidebar list automatically
    StorageService.onPinsChanged((pins, accountKey) => {
      const currentAccount = getAccountFromUrl();
      if (accountKey === currentAccount.accountKey) {
        this.pins = pins;
        this.render();
      }
    });

    await this.refreshPins();
    this.ensureInjected();
  }

  public async refreshPins(): Promise<void> {
    const account = getAccountFromUrl();
    this.pins = await StorageService.getPins(account.accountKey);
    this.render();
  }

  /**
   * Finds the "Starred" navigation item in Drive's sidebar.
   */
  private findStarredAnchor(): HTMLElement | null {
    // Search candidates strictly excluding main view table rows and grid cells
    const candidates = document.querySelectorAll<HTMLElement>(
      'a[href*="/starred"], [data-target="starred"], [role="treeitem"], div[role="link"]'
    );

    for (const el of candidates) {
      if (el.closest(`[role="row"], [role="gridcell"], #${CONTAINER_ID}`)) continue;

      const href = el.getAttribute('href') || el.querySelector('a')?.getAttribute('href') || '';
      const text = el.textContent?.trim().toLowerCase();
      const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';

      if (href.includes('/starred') || text === 'starred' || ariaLabel === 'starred') {
        const item = el.closest<HTMLElement>('[role="treeitem"], [role="listitem"], li') || el;
        return item;
      }
    }

    // Fallback: search for navigation tree container
    const nav = document.querySelector<HTMLElement>(
      'nav, [role="navigation"], div[role="tree"], div[aria-label*="Navigation" i]'
    );
    if (nav) {
      const tree = nav.querySelector<HTMLElement>('[role="tree"], div[role="group"]');
      if (tree && tree.lastElementChild) {
        return tree.lastElementChild as HTMLElement;
      }
      return nav.lastElementChild as HTMLElement;
    }

    return null;
  }

  /**
   * Injects the pinned container directly below "Starred" in the sidebar.
   */
  public ensureInjected(): void {
    const targetAnchor = this.findStarredAnchor();
    if (!targetAnchor) return;

    // Check if container already exists directly following targetAnchor
    const existing = document.getElementById(CONTAINER_ID);
    if (existing && existing.previousElementSibling === targetAnchor) {
      return; // Already present in the exact right spot
    }

    // Create or re-attach container
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = CONTAINER_ID;
      this.container.className = 'drive-pins-sidebar-root';

      Object.assign(this.container.style, {
        margin: '6px 0',
        padding: '0 8px',
        userSelect: 'none',
        fontFamily: 'Google Sans, Roboto, RobotoDraft, Helvetica, Arial, sans-serif',
        fontSize: '14px',
        display: 'block',
        visibility: 'visible',
      });
    }

    targetAnchor.insertAdjacentElement('afterend', this.container);
    this.render();
  }

  private render(): void {
    if (!this.container) return;
    this.container.innerHTML = '';

    // Header element (matches Drive navigation row styling)
    const header = document.createElement('div');
    header.className = 'drive-pins-sidebar-header';
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '36px',
      padding: '0 12px 0 16px',
      borderRadius: '18px',
      cursor: 'pointer',
      color: '#444746',
      fontWeight: '500',
      transition: 'background-color 0.15s',
    });

    header.addEventListener('mouseenter', () => {
      header.style.backgroundColor = 'rgba(68, 71, 70, 0.08)';
    });
    header.addEventListener('mouseleave', () => {
      header.style.backgroundColor = 'transparent';
    });

    // Left title + icon + count
    const headerLeft = document.createElement('div');
    Object.assign(headerLeft.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      color: '#1f1f1f',
    });

    headerLeft.innerHTML = `
      <span style="display: flex; align-items: center; color: #1a73e8;">
        ${ICONS.pinFilled}
      </span>
      <span style="font-size: 14px; font-weight: 500;">Pinned</span>
      <span style="
        font-size: 11px;
        background-color: ${this.pins.length > 0 ? '#e8f0fe' : '#f1f3f4'};
        color: ${this.pins.length > 0 ? '#1a73e8' : '#747775'};
        padding: 1px 7px;
        border-radius: 10px;
        font-weight: 500;
      ">${this.pins.length}</span>
    `;

    // Right chevron toggle
    const chevron = document.createElement('div');
    chevron.style.display = 'flex';
    chevron.style.alignItems = 'center';
    chevron.style.color = '#444746';
    chevron.style.transition = 'transform 0.2s';
    chevron.style.transform = this.isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
    chevron.innerHTML = ICONS.chevronDown;

    header.appendChild(headerLeft);
    header.appendChild(chevron);

    header.addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      StorageService.saveSettings({ sidebarCollapsed: this.isCollapsed });
      chevron.style.transform = this.isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
      pinsList.style.display = this.isCollapsed ? 'none' : 'flex';
    });

    this.container.appendChild(header);

    // Pins List container
    const pinsList = document.createElement('div');
    pinsList.className = 'drive-pins-sidebar-list';
    Object.assign(pinsList.style, {
      display: this.isCollapsed ? 'none' : 'flex',
      flexDirection: 'column',
      gap: '2px',
      marginTop: '2px',
      paddingLeft: '8px',
    });

    if (this.pins.length === 0) {
      const emptyState = document.createElement('div');
      Object.assign(emptyState.style, {
        padding: '10px 16px',
        fontSize: '12px',
        color: '#747775',
        fontStyle: 'italic',
      });
      emptyState.textContent = 'Hover over any file or folder and click the pin icon to add it here.';
      pinsList.appendChild(emptyState);
    } else {
      for (const pin of this.pins) {
        const itemEl = this.createPinRowElement(pin);
        pinsList.appendChild(itemEl);
      }
    }

    this.container.appendChild(pinsList);
  }

  /**
   * Builds an individual pin item row in the sidebar list.
   */
  private createPinRowElement(pin: PinItem): HTMLElement {
    const row = document.createElement('div');
    row.className = 'drive-pins-sidebar-item';
    row.setAttribute('data-pin-id', pin.id);
    row.setAttribute('draggable', 'true');

    Object.assign(row.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '32px',
      padding: '0 8px 0 12px',
      borderRadius: '16px',
      cursor: 'pointer',
      color: '#1f1f1f',
      transition: 'background-color 0.15s, opacity 0.15s',
      position: 'relative',
    });

    // Hover background
    row.addEventListener('mouseenter', () => {
      row.style.backgroundColor = 'rgba(68, 71, 70, 0.08)';
      actions.style.opacity = '1';
    });
    row.addEventListener('mouseleave', () => {
      row.style.backgroundColor = 'transparent';
      actions.style.opacity = '0';
    });

    // Left content: Drag handle + Icon + Label
    const leftContent = document.createElement('div');
    Object.assign(leftContent.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      flex: '1',
    });

    // Icon (Emoji or SVG)
    let iconHtml = '';
    if (pin.emoji) {
      iconHtml = `<span style="font-size: 16px; line-height: 1; flex-shrink: 0;">${pin.emoji}</span>`;
    } else {
      iconHtml = `<span style="display: flex; align-items: center; flex-shrink: 0;">${getItemIcon(pin.type, pin.mimeType, pin.color, pin.title, pin.url)}</span>`;
    }

    const titleText = pin.aliasTitle || cleanTitle(pin.title);
    leftContent.innerHTML = `
      <span class="drag-handle" style="display: flex; align-items: center; color: #747775; cursor: grab; flex-shrink: 0;" title="Drag to reorder">
        ${ICONS.dragHandle}
      </span>
      ${iconHtml}
      <span style="font-size: 13px; font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${titleText}">
        ${titleText}
      </span>
    `;

    // Click handler for navigation
    leftContent.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handlePinNavigation(pin);
    });

    // Right action buttons (Edit & Delete)
    const actions = document.createElement('div');
    actions.className = 'drive-pins-item-actions';
    Object.assign(actions.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      opacity: '0',
      transition: 'opacity 0.15s',
      flexShrink: '0',
    });

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.innerHTML = ICONS.edit;
    editBtn.title = 'Edit alias & color';
    this.styleSmallActionButton(editBtn);
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      PinModal.open(pin, (updated) => {
        const idx = this.pins.findIndex(p => p.id === updated.id);
        if (idx >= 0) {
          this.pins[idx] = updated;
          this.render();
        }
      });
    });

    // Unpin button
    const unpinBtn = document.createElement('button');
    unpinBtn.type = 'button';
    unpinBtn.innerHTML = ICONS.trash;
    unpinBtn.title = 'Unpin';
    this.styleSmallActionButton(unpinBtn);
    unpinBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await StorageService.removePin(pin.id, pin.accountKey);
      showToast(`Unpinned "${pin.aliasTitle || cleanTitle(pin.title)}"`);
    });

    actions.appendChild(editBtn);
    actions.appendChild(unpinBtn);

    row.appendChild(leftContent);
    row.appendChild(actions);

    // Setup drag and drop events
    this.setupDragAndDrop(row, pin);

    return row;
  }

  private styleSmallActionButton(btn: HTMLButtonElement): void {
    Object.assign(btn.style, {
      background: 'none',
      border: 'none',
      color: '#5f6368',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
    });
    btn.addEventListener('mouseenter', () => {
      btn.style.backgroundColor = 'rgba(68, 71, 70, 0.15)';
      btn.style.color = '#1f1f1f';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.backgroundColor = 'transparent';
      btn.style.color = '#5f6368';
    });
  }

  /**
   * Handles navigation: Folders/Shared Drives navigate in-place; Files open in a new tab.
   */
  private handlePinNavigation(pin: PinItem): void {
    if (pin.type === 'folder' || pin.type === 'shared-drive') {
      const tempLink = document.createElement('a');
      tempLink.href = pin.url;
      tempLink.style.display = 'none';
      document.body.appendChild(tempLink);
      tempLink.click();
      tempLink.remove();

      setTimeout(() => {
        if (!window.location.href.includes(pin.id)) {
          window.location.href = pin.url;
        }
      }, 200);
    } else {
      window.open(pin.url, '_blank');
    }
  }

  /**
   * Configures HTML5 drag and drop reordering on sidebar items.
   */
  private setupDragAndDrop(row: HTMLElement, pin: PinItem): void {
    row.addEventListener('dragstart', (e) => {
      this.draggedItemId = pin.id;
      row.style.opacity = '0.4';
      e.dataTransfer?.setData('text/plain', pin.id);
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    row.addEventListener('dragend', () => {
      row.style.opacity = '1';
      this.draggedItemId = null;
      document.querySelectorAll<HTMLElement>('.drive-pins-sidebar-item').forEach(el => {
        el.style.borderTop = '';
        el.style.borderBottom = '';
      });
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!this.draggedItemId || this.draggedItemId === pin.id) return;

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

      if (!this.draggedItemId || this.draggedItemId === pin.id) return;

      const rect = row.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dropBefore = e.clientY < mid;

      const currentOrder = this.pins.map(p => p.id);
      const dragIndex = currentOrder.indexOf(this.draggedItemId);
      if (dragIndex < 0) return;

      currentOrder.splice(dragIndex, 1);

      let targetIndex = currentOrder.indexOf(pin.id);
      if (!dropBefore) {
        targetIndex += 1;
      }
      currentOrder.splice(targetIndex, 0, this.draggedItemId);

      await StorageService.reorderPins(pin.accountKey, currentOrder);
      this.refreshPins();
    });
  }
}

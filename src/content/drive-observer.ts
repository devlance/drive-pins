import { extractItemFromElement, ExtractedDriveItem } from '../utils/dom';
import { findVisibleItemMenu, injectPinIntoMenu } from './menu-pin-item';

/**
 * Delays (ms) after user opens a menu (click/contextmenu/keyboard) to attempt injection.
 */
const MENU_INJECT_DELAYS_MS = [200, 450, 800];

export class DriveObserver {
  private observer: MutationObserver | null = null;
  private currentUrl: string = window.location.href;
  private onSidebarCheck: () => void;
  private lastTargetedItem: ExtractedDriveItem | null = null;
  private menuCheckTimer: number | null = null;

  constructor(onSidebarCheck: () => void) {
    this.onSidebarCheck = onSidebarCheck;
  }

  public async start(): Promise<void> {
    // ── 1. Track which Drive item the user interacted with ──
    const recordTargetedItem = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // In table/list view, ALWAYS prefer the entire row over individual cells
      let itemEl = target.closest<HTMLElement>('[role="row"]:not([aria-hidden="true"])');

      // In grid view / card view, check gridcell, card, item container
      if (!itemEl) {
        itemEl =
          target.closest<HTMLElement>(
            '[role="gridcell"]:not([aria-hidden="true"]), [data-target="item"], div[role="button"]:not([aria-haspopup])'
          ) || target.closest<HTMLElement>('tr, div[data-id]');
      }

      if (itemEl && !itemEl.closest('nav, [role="navigation"]')) {
        const extracted = extractItemFromElement(itemEl);
        if (extracted && extracted.id) {
          this.lastTargetedItem = extracted;
        }
      }
    };

    window.addEventListener('contextmenu', recordTargetedItem, true);
    window.addEventListener('pointerdown', recordTargetedItem, true);
    window.addEventListener('mousedown', recordTargetedItem, true);

    // ── 2. Menu injection triggers (Click, ContextMenu, Keyboard) ──
    const handleMoreActionTrigger = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isMoreBtn =
        target.closest<HTMLElement>(
          '[aria-label*="more" i], [aria-label*="action" i], [data-tooltip*="more" i], [data-tooltip*="action" i], [aria-haspopup]'
        ) !== null ||
        target.closest<HTMLElement>('svg') !== null;

      if (isMoreBtn) {
        this.scheduleMenuInjection();
      }
    };

    document.addEventListener('click', handleMoreActionTrigger, true);
    document.addEventListener('pointerdown', handleMoreActionTrigger, true);
    document.addEventListener('contextmenu', () => this.scheduleMenuInjection(), true);
    document.addEventListener('keydown', (e) => {
      if ((e.shiftKey && e.key === 'F10') || (e.altKey && e.shiftKey && e.key.toLowerCase() === 'a') || e.key === 'ContextMenu') {
        this.scheduleMenuInjection();
      }
    }, true);

    // ── 3. MutationObserver for sidebar + debounced menu appearance ──
    this.observer = new MutationObserver(() => {
      if (this.currentUrl !== window.location.href) {
        this.handleUrlChange();
      }
      this.onSidebarCheck();
      this.debouncedCheckMenu();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Listen to URL / SPA navigation changes
    window.addEventListener('popstate', () => this.handleUrlChange());
    this.patchHistoryApi();

    // Initial checks
    this.onSidebarCheck();
    this.tryInjectMenu();
  }

  /**
   * Safely debounces menu checking during DOM mutations so it never freezes the browser.
   */
  private debouncedCheckMenu(): void {
    if (this.menuCheckTimer !== null) return;
    this.menuCheckTimer = window.setTimeout(() => {
      this.menuCheckTimer = null;
      this.tryInjectMenu();
    }, 120);
  }

  /**
   * Schedules menu injection after user opens a menu, running multiple staggered
   * checks to handle Drive's multi-pass Closure library decoration.
   */
  private scheduleMenuInjection(): void {
    for (const delay of MENU_INJECT_DELAYS_MS) {
      setTimeout(() => this.tryInjectMenu(), delay);
    }
  }

  /**
   * Injects the Pin/Unpin option if a Drive item context menu is currently visible.
   */
  private tryInjectMenu(): void {
    const visibleMenu = findVisibleItemMenu();
    if (!visibleMenu) return;

    // Already injected in this menu
    if (visibleMenu.querySelector('.drive-pins-menu-item')) return;

    const targetItem = this.getTargetItem();
    if (targetItem) {
      injectPinIntoMenu(visibleMenu, targetItem);
    }
  }

  /**
   * Returns the best-known target item:
   * First checks the actively selected row in the current view,
   * then falls back to the last targeted item from pointer/mouse events.
   */
  private getTargetItem(): ExtractedDriveItem | null {
    // 1. Check currently selected row or item container in the active view
    const selectedEl = document.querySelector<HTMLElement>(
      '[role="row"][aria-selected="true"], [role="gridcell"][aria-selected="true"], [data-target="item"][aria-selected="true"]'
    );
    if (selectedEl) {
      const extracted = extractItemFromElement(selectedEl);
      if (extracted && extracted.id) {
        this.lastTargetedItem = extracted;
        return extracted;
      }
    }

    // 2. Fall back to last targeted item
    if (this.lastTargetedItem) {
      return this.lastTargetedItem;
    }

    return null;
  }

  private handleUrlChange(): void {
    this.currentUrl = window.location.href;
    this.onSidebarCheck();
    this.debouncedCheckMenu();
  }

  private patchHistoryApi(): void {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handleUrlChange();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.handleUrlChange();
    };
  }

  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.menuCheckTimer !== null) {
      clearTimeout(this.menuCheckTimer);
      this.menuCheckTimer = null;
    }
  }
}

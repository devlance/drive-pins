import { PinItem } from '../types';
import { StorageService } from '../storage';
import { DRIVE_FOLDER_COLORS } from '../utils/icons';
import { showToast } from './menu-pin-item';
import { cleanTitle } from '../utils/dom';

const POPULAR_EMOJIS = ['📁', '📂', '⭐', '🔥', '🚀', '📊', '📈', '📝', '📌', '💡', '🎯', '💼', '🎨', '⚙️', '🔒', '🏷️'];

export class PinModal {
  private static activeModal: HTMLElement | null = null;

  public static open(pin: PinItem, onSave: (updated: PinItem) => void): void {
    this.close();

    const overlay = document.createElement('div');
    overlay.id = 'drive-pins-modal-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: '1000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Google Sans, Roboto, RobotoDraft, Helvetica, Arial, sans-serif',
      opacity: '0',
      transition: 'opacity 0.2s ease',
    });

    const modal = document.createElement('div');
    modal.className = 'drive-pins-modal';
    Object.assign(modal.style, {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      width: '420px',
      maxWidth: '90vw',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
      transform: 'scale(0.95)',
      transition: 'transform 0.2s ease',
    });

    // Header
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    });
    header.innerHTML = `
      <h2 style="margin: 0; font-size: 18px; font-weight: 500; color: #1f1f1f;">Edit Pin</h2>
      <button class="modal-close" style="background: none; border: none; font-size: 22px; cursor: pointer; color: #5f6368; padding: 4px; border-radius: 50%; line-height: 1;">&times;</button>
    `;

    // Title / Alias Input
    const nameSection = document.createElement('div');
    const displayTitle = pin.aliasTitle || cleanTitle(pin.title);
    const origTitle = cleanTitle(pin.title);
    nameSection.innerHTML = `
      <label style="display: block; font-size: 12px; font-weight: 500; color: #444746; margin-bottom: 6px;">
        Display Name (Alias)
      </label>
      <input type="text" id="pin-alias-input" value="${displayTitle}" style="
        width: 100%;
        box-sizing: border-box;
        padding: 10px 12px;
        font-size: 14px;
        border: 1px solid #747775;
        border-radius: 8px;
        outline: none;
        transition: border-color 0.2s;
      " />
      <div style="font-size: 11px; color: #747775; margin-top: 4px;">Original: ${origTitle}</div>
    `;

    // Emoji Picker
    const emojiSection = document.createElement('div');
    let selectedEmoji = pin.emoji || '';
    emojiSection.innerHTML = `
      <label style="display: block; font-size: 12px; font-weight: 500; color: #444746; margin-bottom: 6px;">
        Emoji Icon (Optional)
      </label>
      <div id="emoji-picker-list" style="display: flex; flex-wrap: wrap; gap: 8px;">
        <button type="button" class="emoji-btn ${!selectedEmoji ? 'selected' : ''}" data-emoji="" style="
          border: 1px solid ${!selectedEmoji ? '#1a73e8' : '#dadce0'};
          background: ${!selectedEmoji ? '#e8f0fe' : '#ffffff'};
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">None</button>
        ${POPULAR_EMOJIS.map(e => `
          <button type="button" class="emoji-btn ${selectedEmoji === e ? 'selected' : ''}" data-emoji="${e}" style="
            border: 1px solid ${selectedEmoji === e ? '#1a73e8' : '#dadce0'};
            background: ${selectedEmoji === e ? '#e8f0fe' : '#ffffff'};
            padding: 6px 8px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
          ">${e}</button>
        `).join('')}
      </div>
    `;

    // Folder Color Palette (if folder or shared-drive)
    const colorSection = document.createElement('div');
    let selectedColor = pin.color || '';
    colorSection.innerHTML = `
      <label style="display: block; font-size: 12px; font-weight: 500; color: #444746; margin-bottom: 6px;">
        Color Tag
      </label>
      <div id="color-picker-grid" style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px;">
        <button type="button" class="color-dot ${!selectedColor ? 'selected' : ''}" data-color="" style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid ${!selectedColor ? '#1a73e8' : '#dadce0'};
          background: #ffffff;
          cursor: pointer;
          position: relative;
        " title="Default"></button>
        ${DRIVE_FOLDER_COLORS.map(c => `
          <button type="button" class="color-dot ${selectedColor === c ? 'selected' : ''}" data-color="${c}" style="
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid ${selectedColor === c ? '#1a73e8' : 'transparent'};
            background-color: ${c};
            cursor: pointer;
            outline: none;
            box-shadow: ${selectedColor === c ? '0 0 0 2px #ffffff inset' : 'none'};
          " title="${c}"></button>
        `).join('')}
      </div>
    `;

    // Action Buttons
    const actions = document.createElement('div');
    Object.assign(actions.style, {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '8px',
      marginTop: '8px',
    });
    actions.innerHTML = `
      <button id="modal-cancel-btn" style="
        background: none;
        border: 1px solid #747775;
        color: #1f1f1f;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
      ">Cancel</button>
      <button id="modal-save-btn" style="
        background: #1a73e8;
        border: none;
        color: #ffffff;
        padding: 8px 20px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
      ">Save</button>
    `;

    modal.appendChild(header);
    modal.appendChild(nameSection);
    modal.appendChild(emojiSection);
    modal.appendChild(colorSection);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    this.activeModal = overlay;

    // Trigger open animation
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      modal.style.transform = 'scale(1)';
    });

    // Wire events
    header.querySelector('.modal-close')?.addEventListener('click', () => this.close());
    actions.querySelector('#modal-cancel-btn')?.addEventListener('click', () => this.close());

    // Emoji selection
    emojiSection.querySelectorAll<HTMLButtonElement>('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedEmoji = btn.getAttribute('data-emoji') || '';
        emojiSection.querySelectorAll<HTMLButtonElement>('.emoji-btn').forEach(b => {
          const isSel = b === btn;
          b.style.borderColor = isSel ? '#1a73e8' : '#dadce0';
          b.style.background = isSel ? '#e8f0fe' : '#ffffff';
        });
      });
    });

    // Color selection
    colorSection.querySelectorAll<HTMLButtonElement>('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        selectedColor = dot.getAttribute('data-color') || '';
        colorSection.querySelectorAll<HTMLButtonElement>('.color-dot').forEach(d => {
          const isSel = d === dot;
          d.style.borderColor = isSel ? '#1a73e8' : (d.getAttribute('data-color') ? 'transparent' : '#dadce0');
          d.style.boxShadow = isSel ? '0 0 0 2px #ffffff inset' : 'none';
        });
      });
    });

    // Save
    actions.querySelector('#modal-save-btn')?.addEventListener('click', async () => {
      const aliasInput = nameSection.querySelector<HTMLInputElement>('#pin-alias-input');
      const newAlias = aliasInput?.value.trim() || '';

      const updates: Partial<PinItem> = {
        aliasTitle: newAlias && newAlias !== origTitle ? newAlias : undefined,
        emoji: selectedEmoji || undefined,
        color: selectedColor || undefined,
      };

      const updated = await StorageService.updatePin(pin.id, pin.accountKey, updates);
      if (updated) {
        showToast('Pin updated');
        onSave(updated);
      }
      this.close();
    });

    // Close on overlay backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    // Focus input
    const input = nameSection.querySelector<HTMLInputElement>('#pin-alias-input');
    input?.focus();
    input?.select();
  }

  public static close(): void {
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }
  }
}

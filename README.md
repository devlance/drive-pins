# Drive Pins - Chrome Extension for Google Drive

**Drive Pins** is a Manifest V3 Chrome extension that lets you pin folders, shared drives, and files in Google Drive for fast, one-click access directly from the left navigation sidebar and the browser toolbar.

---

## Features

- 📌 **In-Line Pinning**: Hover over any folder, shared drive, or file row/card in Google Drive to reveal a pin button. One click pins or unpins it.
- 📂 **Left Sidebar "Pinned" Section**: An expandable/collapsible section anchored directly below **Starred** in Drive's left navigation.
- ⚡ **Smart Hybrid Navigation**:
  - Folders and Shared Drives navigate **in-place** (Drive SPA routing without full page reload).
  - Documents, Sheets, Slides, and binary files open cleanly in a **new tab**.
- 🎨 **Folder Styling & Custom Aliases**:
  - Automatically inherits native Google Drive folder colors (all 24 palette colors) and file-type icons.
  - Right-click or click Edit on any pin to set a custom display alias name, custom color tag, or emoji without touching the original Drive file.
- 🔄 **Drag-and-Drop Reordering**: Smooth drag-and-drop reordering supported both in the sidebar list and in the toolbar popup.
- ☁️ **Seamless Browser Sync**: Built with `chrome.storage.sync` with multi-account isolation (`/u/0/`, `/u/1/`, etc.)—your pins automatically sync across your signed-in Chrome browsers without requiring OAuth or third-party servers.
- 🚀 **Quick-Access Toolbar Hub**: Click the extension icon to search pins, drag to reorder, switch accounts, or pin the current folder with one click.

---

## Quick Start (Load Unpacked in Chrome)

1. Clone or open this repository in your terminal.
2. Build the distribution bundle:
   ```bash
   npm run build
   ```
3. Open Google Chrome and navigate to `chrome://extensions/`.
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** (top-left).
6. Select the `dist/` directory inside this project folder:
   ```
   /Users/brettj/Documents/drive_pins/dist
   ```
7. Open [drive.google.com](https://drive.google.com) and start pinning!

---

## Development & Scripts

- `npm run build`: Compiles TypeScript, bundles the extension with Vite, generates icons, and outputs to `dist/`.
- `npm run typecheck`: Runs strict TypeScript type-checking (`tsc --noEmit`).
- `npm run icons`: Generates crisp PNG icons (16, 32, 48, 128px) into `public/icons/`.

---

## Project Structure

```
drive_pins/
├── dist/                      # Production-ready unpacked extension folder
├── public/
│   └── icons/                 # Generated PNG icons
├── scripts/
│   ├── generate-icons.js      # Pure Node PNG icon generator
│   └── build.js               # Multi-target Vite compiler & asset packager
├── src/
│   ├── background/
│   │   └── service-worker.ts  # Manifest V3 service worker & context menu
│   ├── content/
│   │   ├── content.ts         # Main content script entry point
│   │   ├── drive-observer.ts  # MutationObserver & Drive SPA routing monitor
│   │   ├── row-pin-button.ts  # In-line hover pin buttons & toast notifications
│   │   ├── sidebar-pinned.ts  # Collapsible sidebar pinned tree with drag-and-drop
│   │   └── pin-modal.ts       # Alias rename, color picker, and emoji modal
│   ├── popup/
│   │   ├── popup.html         # Toolbar quick-access popup interface
│   │   ├── popup.css          # Google Material 3 styling
│   │   └── popup.ts           # Search, quick pinning, account switcher, and reordering
│   ├── storage.ts             # Chrome storage sync layer with account isolation
│   ├── types.ts               # Core TypeScript interfaces
│   └── utils/
│       ├── account.ts         # Account detection (/u/0/, /u/1/)
│       ├── dom.ts             # Drive DOM item & metadata extractor
│       └── icons.ts           # Google Material SVG icons & Drive color palette
├── manifest.json              # Manifest V3 configuration
├── package.json
└── tsconfig.json
```

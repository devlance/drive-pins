# Chrome Web Store Listing — Drive Pins

> Last Updated: 2026-11-25

## Store Listing

**Extension Name** [REQUIRED]
Drive Pins - Quick Access for Google Drive

**Short Description** [REQUIRED]
Pin folders, shared drives, and files in Google Drive for quick one-click access directly from your sidebar and browser toolbar.

**Detailed Description** [REQUIRED]
Drive Pins helps you organize and access your most important Google Drive folders, shared drives, and files without endlessly digging through folder trees or waiting on search results.

Key Features:
- Pin via Triple-Dot & Context Menu: Click the "⋮" button on any folder, shared drive, or file (or right-click) to find "Pin to sidebar".
- Sidebar Quick-Access: Adds an expandable "Pinned" section directly beneath "Starred" in your Google Drive navigation bar.
- Smart Navigation: Click any pinned folder to navigate directly inside Drive without reloading the page. Documents, spreadsheets, and slides open in a new tab.
- Native Drive Icons & Colors: Inherits your folder's native Google Drive color and exact file type icon (Google Docs, Sheets, Slides, Forms, PDFs, etc.).
- Custom Display Names & Emojis: Easily set custom display aliases, color tags, or emojis without modifying original Drive files.
- Drag-and-Drop Reordering: Reorganize your pinned items effortlessly in both the Drive sidebar and the extension popup.
- Seamless Sync Across Browsers: Your pinned items automatically sync across any computer where you are signed into your browser profile.
- Multi-Account Support: Keeps your work and personal Drive pins cleanly separated.

How to Use:
1. Open Google Drive (drive.google.com).
2. Click the triple-dot menu ("⋮") on any file or folder (or right-click) and select "Pin to sidebar".
3. Access your pinned items immediately under the "Pinned" section in the left sidebar, or click the Drive Pins toolbar icon anytime.
4. Drag items to reorder them, or click Edit to set a custom display alias, color, or emoji.

Privacy & Security:
Drive Pins operates locally inside your browser. It does not collect, track, or transmit your files, folders, browsing activity, or personal information to any third-party server. All pins are stored securely within your browser's private sync storage.

Support & Feedback:
For questions, bug reports, or feature requests, visit the project repository or reach out via the support tab.

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Enables users to pin, organize, and quickly open frequently used Google Drive folders, shared drives, and files from the sidebar and toolbar.

**Primary Language** [REQUIRED]
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Location |
|---|---|---|---|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `public/icons/icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 PNG/JPEG | ⬜ Action Needed | Capture Drive sidebar showing "Pinned" section |
| Screenshot 2 [RECOMMENDED] | 1280×800 PNG/JPEG | ⬜ Action Needed | Capture "Pin to sidebar" in the triple-dot menu |
| Screenshot 3 [RECOMMENDED] | 1280×800 PNG/JPEG | ⬜ Action Needed | Capture toolbar popup with search & pin list |
| Small Promo Tile [RECOMMENDED] | 440×280 PNG | ⬜ Optional | Promo card for search results |
| Marquee Promo Tile | 1400×560 PNG | ⬜ Optional | Featured banner |

### Screenshot Guide (1280×800)
- **Screenshot 1 (Sidebar View):** Google Drive showing the "Pinned" section beneath "Starred" with a mix of pinned folders (colored), Google Docs, Sheets, and Slides.
- **Screenshot 2 (Menu View):** Google Drive list view showing the open triple-dot context menu with the "Pin to sidebar" option.
- **Screenshot 3 (Toolbar Popup):** The extension toolbar popup open with search active and dragged items.

---

## Permissions Justification (Copy-Paste for Dashboard)

| Permission | Type | Justification to paste into CWS Dashboard |
|---|---|---|
| `storage` | permissions | Stores and syncs the user's pinned items, custom display aliases, and ordering preferences across signed-in browser instances using chrome.storage.sync. |
| `tabs` | permissions | Detects whether the active browser tab is on Google Drive to enable one-click folder pinning from the popup and navigate the current tab directly. |
| `contextMenus` | permissions | Adds a "Pin / Unpin in Drive Pins" option to the browser's right-click context menu when viewing Google Drive files and folders. |
| `https://drive.google.com/*` | host_permissions | Required to inject the collapsible "Pinned" section into Google Drive's sidebar and add the "Pin to sidebar" item to Drive's native context menus. |

---

## Privacy & Data Use (Declarations in CWS Console)

In the **Privacy** tab of the Chrome Web Store Developer Dashboard:

### Single Purpose Compliance
- **Check the box:** Yes, the extension has a single purpose.
- **Enter:** "Enables users to pin, organize, and quickly open frequently used Google Drive folders, shared drives, and files from the sidebar and toolbar."

### Permission Justifications
- Enter the justifications from the table above for each requested permission.

### Data Usage
- **Does your product collect user data?** Select **"No, I am not collecting or using user data"**.
- Check all the boxes confirming:
  - Not selling user data
  - Not using data for unrelated purposes
  - Not using data for creditworthiness or lending

---

## Step-by-Step Publishing Checklist

1. [x] Build and package extension: `npm run package` (creates `drive-pins-v1.0.0.zip`)
2. [ ] Register Chrome Web Store Developer account ($5 one-time fee at https://chrome.google.com/webstore/devconsole)
3. [ ] Click **Add new item** and upload `drive-pins-v1.0.0.zip`
4. [ ] Fill in **Store Listing** (copy from above: Name, Short Description, Detailed Description, Category)
5. [ ] Upload **Store Icon** (`public/icons/icon-128.png`)
6. [ ] Upload at least 1 **Screenshot** (1280×800)
7. [ ] Fill in **Privacy practices** tab (paste justifications from above, declare no data collection)
8. [ ] Provide a link to a **Privacy Policy** (e.g. GitHub Gist or hosted markdown page)
9. [ ] Click **Submit for Review** (reviews typically take 24–48 hours)

# Privacy Policy for Drive Pins

*Last updated: November 25, 2026*

**Drive Pins** ("we", "our", or "the extension") is a browser extension developed to help users pin and quickly access frequently used Google Drive folders, shared drives, and files. We are deeply committed to respecting and protecting your privacy.

## 1. Information Collection and Use

**Drive Pins does not collect, transmit, store, or sell any personal information or Google Drive content.**

Specifically:
- **No Remote Tracking or Analytics:** The extension contains no analytics packages, tracking scripts, advertising SDKs, or telemetry.
- **No Third-Party Transmission:** None of your data, file names, folder names, account emails, or URLs are ever transmitted to any external server or third party.
- **Local Browser Storage Only:** All pins, display aliases, color tags, emojis, and preferences are stored exclusively on your device using Chrome's built-in `chrome.storage.sync` and `chrome.storage.local` APIs.
- **Account Isolation:** Multi-account identifiers (`/u/0/`, `/u/1/`) are parsed locally solely to separate your pins across different signed-in Google profiles on your machine.

## 2. Permissions Justification

Drive Pins requests only the minimal permissions required to provide its core features:

- **`storage`**: Used to save and sync your pinned items, aliases, and ordering across your signed-in browser instances.
- **`tabs`**: Used only to check if the currently focused tab is on Google Drive when you click "Pin current page" in the popup, and to navigate within the tab when a pinned item is clicked.
- **`contextMenus`**: Used to add a convenient "Pin / Unpin in Drive Pins" option to your browser's right-click context menu on Drive pages.
- **`https://drive.google.com/*`**: Required to inject the "Pinned" section into Google Drive's left navigation sidebar and add the "Pin to sidebar" option to the native context menu.

## 3. Data Retention and Deletion

All data created by Drive Pins is retained locally in your browser profile until you choose to unpin items or remove the extension. If you uninstall the extension, all locally saved preferences and pins are completely deleted by your browser.

## 4. Changes to This Policy

If we ever make changes to this privacy policy, the updated policy will be posted on this page with an updated revision date.

## 5. Contact

If you have any questions or concerns regarding this Privacy Policy, please open an issue on the project's GitHub repository or contact us through the Chrome Web Store support page.

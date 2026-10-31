# 🐻 Gemini Desktop Pet Companion

A Chrome extension that summons a customizable desktop pet companion on any webpage. It bridges directly to your open `gemini.google.com` tab, allowing you to chat with Gemini effortlessly while browsing the web.

---

## ✨ Features

* **Cross-Tab Gemini Bridge:** Sends prompts and streams live responses between your active webpage and an open Gemini tab in the background.
* **Frosted-Glass UI:** Modern translucent floating pill and response card featuring glassmorphism (`backdrop-filter: blur()`).
* **6-State Animation Engine:** Manages behaviors for **Idle**, **Walking**, **Listening**, **Thinking**, **Speaking**, and **Dragging**.
* **Custom Asset Manager:** Upload your own transparent GIFs, APNGs, or multi-frame PNG sequences for each pet state via the extension popup menu.
* **Voice Dictation:** Built-in Web Speech API integration so you can talk directly to your pet.
* **Draggable Pet:** Easily reposition your companion anywhere on your screen.

---


## 📂 Project Structure

```text
gemini-pet-extension/
├── manifest.json         # Extension configuration (Manifest V3)
├── background.js         # Service worker & tab message router
├── content_gemini.js     # DOM injector & response scraper for Gemini tab
├── content_pet.js        # Shadow DOM pet renderer & state machine
├── gemini_keepawake.js   # Force gemini tab awake
├── popup.html            # Extension settings UI
└── popup.js              # Asset loader & local storage manager

```

---

## 🚀 Installation & Setup

1. **Clone or Download** this repository to your local machine:
```bash
git clone [https://github.com/kentKH245/gemini-web-pet-extension.git](https://github.com/kentKH245/gemini-web-pet-extension.git)

```
2. Open Google Chrome and navigate to **`chrome://extensions/`**.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner and select your `gemini-web-pet-extension` folder.
5. Open [gemini.google.com](https://gemini.google.com) in one tab and ensure you are logged in.
6. Open any other website (e.g., Wikipedia or news sites)—your pet companion will appear in the bottom-left corner!
***
- Reload chrome after your first load
- The **gemini webpage must be active** for the connection, separate window for the tab would work.
- The first question may stuck due to inactive status of gemini webpage in the background, switch to the tab once will fix the connection.
***


https://github.com/user-attachments/assets/1b808467-fe8d-4e1e-8510-cf5c1576112e


---

## 🎨 Customizing Pet Animations

1. Click the extension icon in your Chrome toolbar to open the **Settings Popup**.
2. For any state (**Idle**, **Walking**, **Listening**, **Thinking**, **Speaking**, **Dragging**), click **Upload** to select your custom GIF, WebP, or multiple PNG frames.
<img width="378" height="533" alt="image" src="https://github.com/user-attachments/assets/320ed849-19d9-4084-8a6f-5a377be1d5db" />

3. Adjust the frame speed slider if using multi-frame PNGs.
4. Changes apply instantly across your open browser tabs via `chrome.storage.local`.

---

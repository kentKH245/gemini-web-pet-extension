let lastPetTabId = null;

async function getOrCreateGeminiTab() {
  const tabs = await chrome.tabs.query({ url: "https://gemini.google.com/*" });
  if (tabs.length > 0) {
    return tabs[0];
  }
  // Create a background Gemini tab if none is open
  const newTab = await chrome.tabs.create({ url: "https://gemini.google.com/app", active: false });
  return new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === newTab.id && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        setTimeout(() => resolve(newTab), 1500);
      }
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SEND_PROMPT") {
    lastPetTabId = sender.tab ? sender.tab.id : null;
    getOrCreateGeminiTab().then((geminiTab) => {
      chrome.tabs.sendMessage(geminiTab.id, {
        type: "EXECUTE_PROMPT",
        prompt: message.prompt
      }, (resp) => {
        if (chrome.runtime.lastError && lastPetTabId) {
          chrome.tabs.sendMessage(lastPetTabId, {
            type: "GEMINI_STREAM",
            text: "Connecting to your Gemini tab, please try again in a moment 🐻",
            done: true
          });
        }
      });
    });
    sendResponse({ status: "dispatched" });
    return true;
  }

  if (message.type === "OPEN_GEMINI_TAB") {
    getOrCreateGeminiTab().then((geminiTab) => {
      chrome.tabs.update(geminiTab.id, { active: true });
      chrome.windows.update(geminiTab.windowId, { focused: true });
    });
    return true;
  }

  if (message.type === "GEMINI_STREAM") {
    if (lastPetTabId) {
      chrome.tabs.sendMessage(lastPetTabId, message);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, message);
      });
    }
  }
});
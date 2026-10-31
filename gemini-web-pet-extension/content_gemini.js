let pollTimer = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXECUTE_PROMPT") {
    injectAndSubmitPrompt(message.prompt);
    sendResponse({ ok: true });
  }
});

function getResponseNodes() {
  // Prioritize top-level message-content wrapper so we never grab a partial child paragraph
  const messageContents = document.querySelectorAll("message-content");
  if (messageContents.length > 0) return messageContents;
  return document.querySelectorAll(".model-response-text, .markdown");
}

function injectAndSubmitPrompt(promptText) {
  const editor = document.querySelector(
    '.ql-editor, div[contenteditable="true"][role="textbox"], rich-textarea div[contenteditable="true"]'
  );

  if (!editor) {
    chrome.runtime.sendMessage({
      type: "GEMINI_STREAM",
      text: "Could not find the Gemini input box. Please make sure you are signed in to Gemini.",
      done: true
    });
    return;
  }

  const initialCount = getResponseNodes().length;

  editor.focus();
  document.execCommand("selectAll", false, null);
  const inserted = document.execCommand("insertText", false, promptText);
  if (!inserted) {
    editor.innerHTML = `<p>${promptText}</p>`;
    editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }

  setTimeout(() => {
    const sendBtn = document.querySelector(
      'button.send-button, button[aria-label*="Send"], button[aria-label*="Submit"]'
    );
    if (sendBtn && !sendBtn.disabled) {
      sendBtn.click();
    } else {
      editor.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true
        })
      );
    }
    pollGeminiResponse(initialCount);
  }, 250);
}

function pollGeminiResponse(initialCount) {
  if (pollTimer) clearInterval(pollTimer);

  let lastText = "";
  let stableTicks = 0;
  let elapsedTicks = 0;

  pollTimer = setInterval(() => {
    elapsedTicks++;
    const nodes = getResponseNodes();

    // Wait until a new response container appears
    if (nodes.length <= initialCount && elapsedTicks < 15) return;
    if (nodes.length === 0) return;

    const latestNode = nodes[nodes.length - 1];
    // Use innerText with textContent fallback for background tabs
    const currentText = (latestNode.innerText || latestNode.textContent || "").trim();

    // Detect if Gemini is still actively generating
    const isGenerating = Boolean(
      document.querySelector(
        'button[aria-label*="Stop"], button[aria-label*="停止"], .stop-icon, mat-spinner, [aria-busy="true"]'
      )
    );

    if (currentText) {
      if (currentText !== lastText) {
        lastText = currentText;
        stableTicks = 0;
        chrome.runtime.sendMessage({
          type: "GEMINI_STREAM",
          text: currentText,
          done: false
        });
      } else if (!isGenerating) {
        stableTicks++;
        // Wait ~4 seconds (10 ticks * 400ms) of unchanged text after stop button disappears
        if (stableTicks >= 10) {
          chrome.runtime.sendMessage({
            type: "GEMINI_STREAM",
            text: currentText,
            done: true
          });
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }
    }

    // Safety timeout after 2 minutes
    if (elapsedTicks > 300) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }, 400);
}
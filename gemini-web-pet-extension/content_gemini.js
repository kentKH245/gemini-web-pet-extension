let streamObserver = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXECUTE_PROMPT") {
    injectAndSubmitPrompt(message.prompt);
    sendResponse({ ok: true });
  }
});

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
    observeGeminiResponse();
  }, 250);
}

function observeGeminiResponse() {
  if (streamObserver) streamObserver.disconnect();
  let lastText = "";
  let stableCount = 0;

  streamObserver = new MutationObserver(() => {
    const responses = document.querySelectorAll(
      "message-content, .model-response-text, .markdown"
    );
    if (responses.length === 0) return;

    const latestNode = responses[responses.length - 1];
    const currentText = latestNode.innerText.trim();

    if (currentText) {
      if (currentText === lastText) {
        // Text hasn't changed in this tick; increment stability check
        stableCount++;
        // If text remains identical for ~1.5 seconds of polling, generation is done
        if (stableCount > 6) {
          chrome.runtime.sendMessage({
            type: "GEMINI_STREAM",
            text: currentText,
            done: true
          });
          streamObserver.disconnect();
          return;
        }
      } else {
        // Text is actively streaming/updating
        lastText = currentText;
        stableCount = 0;
        chrome.runtime.sendMessage({
          type: "GEMINI_STREAM",
          text: currentText,
          done: false
        });
      }
    }
  });

  streamObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}
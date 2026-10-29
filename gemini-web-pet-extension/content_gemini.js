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
  let checkAttempts = 0;

  streamObserver = new MutationObserver(() => {
    const responses = document.querySelectorAll(
      "message-content, .model-response-text, .markdown"
    );
    if (responses.length === 0) return;

    const latestNode = responses[responses.length - 1];
    const currentText = latestNode.innerText.trim();

    // Check if Gemini is still generating (look for stop buttons or loading spinners)
    const isGenerating = document.querySelector(
      'button[aria-label*="Stop"], button[aria-label*="停止"], .generating-icon, mat-spinner'
    );

    if (currentText) {
      if (currentText !== lastText) {
        lastText = currentText;
        checkAttempts = 0;
        // Stream live text chunks while generating
        chrome.runtime.sendMessage({
          type: "GEMINI_STREAM",
          text: currentText,
          done: false
        });
      } else if (!isGenerating) {
        // Text is static and Gemini's stop/generating indicator is gone
        checkAttempts++;
        // Wait a few cycles to ensure generation is fully finished
        if (checkAttempts > 5) {
          chrome.runtime.sendMessage({
            type: "GEMINI_STREAM",
            text: currentText,
            done: true
          });
          streamObserver.disconnect();
        }
      }
    }
  });

  streamObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true
  });
}
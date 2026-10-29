(function () {
  if (document.getElementById("gemini-pet-root")) return;

  const DEFAULT_BEAR_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140">
      <g stroke="#111" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="#fff">
        <circle cx="34" cy="24" r="10"/>
        <circle cx="86" cy="24" r="10"/>
        <path d="M 32 95 C 24 72, 22 30, 60 28 C 98 30, 96 72, 88 95 C 88 112, 86 128, 79 128 C 72 128, 72 110, 70 108 L 50 108 C 48 110, 48 128, 41 128 C 34 128, 32 112, 32 95 Z"/>
        <path d="M 30 68 C 22 80, 22 92, 27 95"/>
        <path d="M 90 68 C 98 80, 98 92, 93 95"/>
      </g>
      <circle cx="48" cy="54" r="3.2" fill="#111"/>
      <circle cx="68" cy="54" r="3.2" fill="#111"/>
      <ellipse cx="58" cy="62" rx="4" ry="3" fill="#111"/>
      <path d="M 58 64 Q 53 70 49 66 M 58 64 Q 63 70 67 66" stroke="#111" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`);

  const host = document.createElement("div");
  host.id = "gemini-pet-root";
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    :host {
      position: fixed;
      bottom: 32px;
      left: 32px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
    }
    .pet-wrapper {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      position: relative;
    }
    .pet-stage {
      width: 96px;
      height: 108px;
      cursor: grab;
      margin-left: 14px;
      margin-bottom: -6px;
      transition: transform 0.25s ease;
      position: relative;
      z-index: 2;
    }
    .pet-stage:active {
      cursor: grabbing;
    }
    .pet-sprite {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 6px 12px rgba(0,0,0,0.18));
      pointer-events: none;
    }
    .state-badge {
      position: absolute;
      top: 0;
      right: -18px;
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      padding: 2px 7px;
      font-size: 11px;
      color: #222;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      display: none;
      white-space: nowrap;
    }
    .state-badge.visible {
      display: block;
    }
    .glass {
      background: linear-gradient(135deg, rgba(220, 236, 248, 0.78), rgba(242, 246, 250, 0.72));
      backdrop-filter: blur(16px) saturate(160%);
      -webkit-backdrop-filter: blur(16px) saturate(160%);
      border: 1px solid rgba(255, 255, 255, 0.65);
      box-shadow: 0 10px 28px rgba(15, 30, 50, 0.16);
      color: #1f2937;
    }
    .action-pill {
      display: flex;
      align-items: center;
      border-radius: 999px;
      padding: 6px 10px;
      gap: 4px;
      margin-bottom: 10px;
    }
    .pill-btn {
      background: transparent;
      border: none;
      width: 44px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #1e293b;
      border-radius: 999px;
      transition: background 0.15s;
    }
    .pill-btn:hover {
      background: rgba(255, 255, 255, 0.45);
    }
    .pill-btn.recording {
      color: #dc2626;
      animation: pulse 1s infinite;
    }
    .divider {
      width: 1px;
      height: 20px;
      background: rgba(30, 41, 59, 0.14);
    }
    .input-bar {
      display: none;
      align-items: center;
      width: 440px;
      max-width: 86vw;
      height: 54px;
      border-radius: 999px;
      padding: 0 10px 0 16px;
      margin-bottom: 10px;
      box-sizing: border-box;
    }
    .input-bar.active {
      display: flex;
    }
    .action-pill.hidden {
      display: none;
    }
    .plus-btn {
      background: transparent;
      border: none;
      font-size: 26px;
      font-weight: 300;
      color: #1e293b;
      cursor: pointer;
      margin-right: 10px;
      line-height: 1;
      padding: 4px 8px;
      border-radius: 50%;
    }
    .plus-btn:hover {
      background: rgba(255,255,255,0.45);
    }
    .prompt-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 16px;
      color: #1e293b;
      outline: none;
    }
    .prompt-input::placeholder {
      color: rgba(30, 41, 59, 0.48);
      font-weight: 500;
    }
    .send-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: none;
      background: rgba(147, 178, 232, 0.75);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s;
    }
    .send-btn:hover {
      background: rgba(99, 142, 224, 0.95);
    }
    .response-card {
      width: 440px;
      max-width: 86vw;
      border-radius: 24px;
      padding: 14px 20px;
      box-sizing: border-box;
      transition: opacity 0.2s, transform 0.2s;
    }
    .response-card.collapsed {
      display: none;
    }
    .resp-title {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .resp-body {
      font-size: 15px;
      line-height: 1.5;
      color: #1f2937;
      max-height: 160px;
      overflow-y: auto;
      white-space: pre-wrap;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
  `;

  const container = document.createElement("div");
  container.className = "pet-wrapper";
  container.innerHTML = `
    <div class="pet-stage" id="petStage" title="Drag to move / Click to chat">
      <img class="pet-sprite" id="petSprite" src="${DEFAULT_BEAR_SVG}" alt="Pet" />
      <div class="state-badge" id="stateBadge">💭</div>
    </div>

    <!-- Compact Pill (Mode A) -->
    <div class="action-pill glass" id="actionPill">
      <button class="pill-btn" id="btnCompose" title="Start a conversation">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <div class="divider"></div>
      <button class="pill-btn" id="btnVoice" title="Voice input">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="4" y1="10" x2="4" y2="14"/><line x1="8" y1="6" x2="8" y2="18"/>
          <line x1="12" y1="3" x2="12" y2="21"/><line x1="16" y1="6" x2="16" y2="18"/>
          <line x1="20" y1="10" x2="20" y2="14"/>
        </svg>
      </button>
      <div class="divider"></div>
      <button class="pill-btn" id="btnToggleCard" title="Collapse / Expand message">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    </div>

    <!-- Expanded Input Bar (Mode B) -->
    <div class="input-bar glass" id="inputBar">
      <button class="plus-btn" id="btnOpenGemini" title="Open Gemini tab">+</button>
      <input type="text" class="prompt-input" id="promptInput" placeholder="Start a new chat..." />
      <button class="send-btn" id="btnSend" title="Send">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"/>
          <polyline points="5 12 12 5 19 12"/>
        </svg>
      </button>
    </div>

    <!-- Response Card -->
    <div class="response-card glass" id="responseCard">
      <div class="resp-title" id="respTitle">What is the pet doing?</div>
      <div class="resp-body" id="respBody">Standing by and waiting for you! What are you up to?</div>
    </div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(container);

  const petStage = shadow.getElementById("petStage");
  const petSprite = shadow.getElementById("petSprite");
  const stateBadge = shadow.getElementById("stateBadge");
  const actionPill = shadow.getElementById("actionPill");
  const inputBar = shadow.getElementById("inputBar");
  const promptInput = shadow.getElementById("promptInput");
  const responseCard = shadow.getElementById("responseCard");
  const respTitle = shadow.getElementById("respTitle");
  const respBody = shadow.getElementById("respBody");

  const STATES = ["IDLE", "WALK", "LISTENING", "THINKING", "SPEAKING", "DRAGGING"];
  let currentState = "IDLE";
  let stateAssets = {};
  let frameIndex = 0;
  let frameSpeed = 250;
  let frameTimer = null;
  let walkOffset = 0;
  let walkDir = 1;

  function loadStoredAssets() {
    chrome.storage.local.get(["petAssets", "frameSpeed"], (data) => {
      stateAssets = data.petAssets || {};
      frameSpeed = data.frameSpeed || 250;
      restartFrameLoop();
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") loadStoredAssets();
  });

  function setPetState(newState) {
    if (currentState === newState) return;
    currentState = newState;
    frameIndex = 0;

    if (newState === "THINKING") {
      stateBadge.textContent = "💭 Thinking...";
      stateBadge.classList.add("visible");
    } else if (newState === "LISTENING") {
      stateBadge.textContent = "👂 Listening";
      stateBadge.classList.add("visible");
    } else {
      stateBadge.classList.remove("visible");
    }

    if (newState !== "WALK") {
      petStage.style.transform = `translateX(${walkOffset}px) scaleX(1)`;
    }
    renderCurrentFrame();
  }

  function renderCurrentFrame() {
    const frames =
      (stateAssets[currentState] && stateAssets[currentState].length > 0
        ? stateAssets[currentState]
        : stateAssets["IDLE"]) || [DEFAULT_BEAR_SVG];

    const src = frames[frameIndex % frames.length] || DEFAULT_BEAR_SVG;
    if (petSprite.src !== src) {
      petSprite.src = src;
    }
    frameIndex = (frameIndex + 1) % frames.length;
  }

  function restartFrameLoop() {
    if (frameTimer) clearInterval(frameTimer);
    renderCurrentFrame();
    frameTimer = setInterval(() => {
      renderCurrentFrame();
      if (currentState === "WALK") {
        walkOffset += walkDir * 6;
        if (walkOffset > 140) walkDir = -1;
        if (walkOffset < 0) walkDir = 1;
        petStage.style.transform = `translateX(${walkOffset}px) scaleX(${walkDir === -1 ? -1 : 1})`;
      }
    }, frameSpeed);
  }

  setInterval(() => {
    if (currentState === "IDLE" && Math.random() < 0.45) {
      setPetState("WALK");
    } else if (currentState === "WALK" && Math.random() < 0.55) {
      setPetState("IDLE");
    }
  }, 5000);

  loadStoredAssets();

  let isDragging = false;
  let dragMoved = false;
  let startX, startY, initialLeft, initialBottom;

  petStage.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    const rect = host.getBoundingClientRect();
    initialLeft = rect.left;
    initialBottom = window.innerHeight - rect.bottom;
    setPetState("DRAGGING");
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
    host.style.left = `${Math.max(10, initialLeft + dx)}px`;
    host.style.bottom = `${Math.max(10, initialBottom - dy)}px`;
  });

  window.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    setPetState(inputBar.classList.contains("active") ? "LISTENING" : "IDLE");
  });

  function openInputBar() {
    actionPill.classList.add("hidden");
    inputBar.classList.add("active");
    promptInput.focus();
    setPetState("LISTENING");
  }

  function closeInputBar() {
    inputBar.classList.remove("active");
    actionPill.classList.remove("hidden");
    if (currentState === "LISTENING") setPetState("IDLE");
  }

  petStage.addEventListener("click", () => {
    if (dragMoved) return;
    if (inputBar.classList.contains("active")) {
      closeInputBar();
    } else {
      openInputBar();
    }
  });

  shadow.getElementById("btnCompose").addEventListener("click", openInputBar);

  shadow.getElementById("btnToggleCard").addEventListener("click", () => {
    responseCard.classList.toggle("collapsed");
  });

  shadow.getElementById("btnOpenGemini").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_GEMINI_TAB" });
  });

  function submitPrompt() {
    const text = promptInput.value.trim();
    if (!text) return;
    respTitle.textContent = text;
    respBody.textContent = "Asking Gemini for you...";
    responseCard.classList.remove("collapsed");
    promptInput.value = "";
    closeInputBar();
    setPetState("THINKING");

    chrome.runtime.sendMessage({
      type: "SEND_PROMPT",
      prompt: text
    });
  }

  shadow.getElementById("btnSend").addEventListener("click", submitPrompt);
  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitPrompt();
    if (e.key === "Escape") closeInputBar();
  });

  // Web Speech API Voice Dictation (Defaults to browser locale or en-US)
  const btnVoice = shadow.getElementById("btnVoice");
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = false;

    btnVoice.addEventListener("click", () => {
      btnVoice.classList.add("recording");
      setPetState("LISTENING");
      recognition.start();
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      openInputBar();
      promptInput.value = transcript;
    };

    recognition.onend = () => {
      btnVoice.classList.remove("recording");
    };
  } else {
    btnVoice.addEventListener("click", openInputBar);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "GEMINI_STREAM") {
      responseCard.classList.remove("collapsed");
      respBody.textContent = message.text;
      if (!message.done) {
        setPetState("SPEAKING");
      } else {
        setTimeout(() => setPetState("IDLE"), 2500);
      }
    }
  });
})();
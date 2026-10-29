const STATE_CONFIG = [
  { id: "IDLE", name: "Idle (IDLE)", desc: "Standing & breathing when inactive" },
  { id: "WALK", name: "Walking (WALK)", desc: "Wandering left and right" },
  { id: "LISTENING", name: "Listening (LISTENING)", desc: "Waiting for you to type or speak" },
  { id: "THINKING", name: "Thinking (THINKING)", desc: "Waiting for Gemini's response" },
  { id: "SPEAKING", name: "Speaking (SPEAKING)", desc: "Streaming reply into the card" },
  { id: "DRAGGING", name: "Dragging (DRAGGING)", desc: "Picked up and moved with cursor" }
];

const stateListEl = document.getElementById("stateList");
const speedRange = document.getElementById("speedRange");
const speedVal = document.getElementById("speedVal");

function renderUI(petAssets = {}) {
  stateListEl.innerHTML = "";
  STATE_CONFIG.forEach((st) => {
    const frames = petAssets[st.id] || [];
    const previewSrc = frames[0] || "";
    const frameLabel = frames.length
      ? `${frames.length} frame${frames.length > 1 ? "s" : ""}`
      : "Default";

    const row = document.createElement("div");
    row.className = "state-row";
    row.innerHTML = `
      <div class="state-info">
        <span class="state-name">${st.name}</span>
        <span class="state-desc">${st.desc} (${frameLabel})</span>
      </div>
      <div class="preview-box">
        ${previewSrc ? `<img class="thumb" src="${previewSrc}" />` : ""}
        <label class="upload-label">
          Upload
          <input type="file" accept="image/png,image/gif,image/webp" multiple data-state="${st.id}" />
        </label>
      </div>
    `;
    stateListEl.appendChild(row);
  });

  document.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener("change", handleFileUpload);
  });
}

function handleFileUpload(e) {
  const stateId = e.target.getAttribute("data-state");
  const files = Array.from(e.target.files);
  if (!files.length) return;

  Promise.all(
    files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    )
  ).then((base64Frames) => {
    chrome.storage.local.get(["petAssets"], (data) => {
      const petAssets = data.petAssets || {};
      petAssets[stateId] = base64Frames;
      chrome.storage.local.set({ petAssets }, () => renderUI(petAssets));
    });
  });
}

chrome.storage.local.get(["petAssets", "frameSpeed"], (data) => {
  renderUI(data.petAssets || {});
  if (data.frameSpeed) {
    speedRange.value = data.frameSpeed;
    speedVal.textContent = data.frameSpeed;
  }
});

speedRange.addEventListener("input", () => {
  const val = Number(speedRange.value);
  speedVal.textContent = val;
  chrome.storage.local.set({ frameSpeed: val });
});

document.getElementById("resetBtn").addEventListener("click", () => {
  chrome.storage.local.remove("petAssets", () => renderUI({}));
});
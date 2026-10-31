// Runs in the MAIN world of gemini.google.com to prevent Chrome from freezing streaming in background tabs
(function () {
  const realHiddenDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "hidden");
  const isActuallyHidden = () =>
    realHiddenDescriptor ? realHiddenDescriptor.get.call(document) : false;

  // 1. Spoof Page Visibility API so Gemini never pauses its own streaming loop
  Object.defineProperty(document, "hidden", {
    get: () => false,
    configurable: true
  });
  Object.defineProperty(document, "visibilityState", {
    get: () => "visible",
    configurable: true
  });

  window.addEventListener(
    "visibilitychange",
    (e) => {
      e.stopImmediatePropagation();
    },
    true
  );

  // 2. Fallback requestAnimationFrame to setTimeout when tab is in the background
  const origRAF = window.requestAnimationFrame.bind(window);
  const origCancelRAF = window.cancelAnimationFrame.bind(window);

  window.requestAnimationFrame = function (callback) {
    if (isActuallyHidden()) {
      return window.setTimeout(() => callback(performance.now()), 40);
    }
    return origRAF(callback);
  };

  window.cancelAnimationFrame = function (id) {
    window.clearTimeout(id);
    origCancelRAF(id);
  };
})();
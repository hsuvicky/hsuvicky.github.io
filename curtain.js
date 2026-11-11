// Cat paw: click it and it closes, then whips back off the left edge. No navigation yet;
// what the pull reveals is still to be decided.
(() => {
  const paw = document.querySelector("[data-curtain-pull]");
  if (!paw) return;

  const GRAB = 170; // paw closes before it leaves

  paw.addEventListener("click", () => {
    if (paw.classList.contains("is-grab")) return;
    paw.classList.add("is-grab");
    window.setTimeout(() => {
      paw.classList.add("is-yank");
      paw.blur();
    }, GRAB);
  });
})();

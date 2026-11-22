const previewMotion = matchMedia("(prefers-reduced-motion: reduce)");
const previewDialog = document.querySelector(".game-preview");
const previewImage = previewDialog.querySelector("img");
const previewTitle = previewDialog.querySelector("h2");
const compactPreview = matchMedia("(max-width: 640px), (pointer: coarse)");
let previewCover;

function clearPreviewMotion() {
  previewImage.getAnimations().forEach((animation) => animation.cancel());
  previewCover?.remove();
  previewCover = undefined;
}

for (const link of document.querySelectorAll(".game-shot, .lobby-image")) {
  link.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    clearPreviewMotion();
    const image = link.querySelector("img");
    const origin = link.dataset.previewSize && !previewMotion.matches && !compactPreview.matches
      ? image.getBoundingClientRect()
      : null;
    const size = link.dataset.previewSize?.split(" ") || [image.getAttribute("width"), image.getAttribute("height")];
    const [width, height] = size.map(Number);
    previewImage.width = width;
    previewImage.height = height;
    previewDialog.style.width = `min(${width}px, calc(max(1px, 100dvh - 104px) * ${width / height}))`;
    previewImage.src = link.href;
    previewImage.alt = image.dataset.previewAlt || image.alt;
    previewTitle.textContent = link.dataset.previewTitle || link.closest(".game").querySelector("h3").textContent;
    link.focus({ preventScroll: true });
    previewDialog.showModal();

    if (!link.dataset.previewSize || previewMotion.matches) return;
    const timing = { duration: origin ? 220 : 140, easing: "cubic-bezier(.2, .75, .25, 1)" };
    const reveal = origin
      ? [{ opacity: 0 }, { opacity: 0.15, offset: 0.42 }, { opacity: 1 }]
      : [{ opacity: 0.5 }, { opacity: 1 }];
    previewImage.animate(reveal, { ...timing, easing: "ease-out" });
    if (!origin) return;

    const target = previewImage.getBoundingClientRect();
    const x = target.left + (target.width - origin.width) / 2 - origin.left;
    const y = target.top + (target.height - origin.height) / 2 - origin.top;
    const cover = new Image();
    cover.className = "preview-cover";
    cover.alt = "";
    cover.src = image.currentSrc || image.src;
    cover.style.left = `${origin.left}px`;
    cover.style.top = `${origin.top}px`;
    cover.style.width = `${origin.width}px`;
    previewDialog.append(cover);
    previewCover = cover;
    cover.animate([
      { transform: "none", opacity: 1 },
      { opacity: 0.9, offset: 0.44 },
      { transform: `translate(${x}px, ${y}px) scale(1.06)`, opacity: 0 },
    ], timing).onfinish = () => {
      cover.remove();
      if (previewCover === cover) previewCover = undefined;
    };
  });
}
previewDialog.addEventListener("close", () => {
  if (!previewDialog.open) clearPreviewMotion();
});
previewMotion.addEventListener("change", () => {
  if (previewMotion.matches) clearPreviewMotion();
});
previewDialog.addEventListener("click", (event) => {
  if (event.target === previewDialog) previewDialog.close();
});

const root = document.documentElement;
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const boot = document.querySelector("#boot");

if (root.classList.contains("booting")) {
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  const splashTitle = boot.querySelector(".boot-word");
  const word = splashTitle.textContent;
  splashTitle.dataset.word = word;
  splashTitle.textContent = "";
  // Keep the app's startup beat with one distortion before the page reveal.
  const frame = 1000 / 24;
  const wordAt = 1000;
  const doneAt = 2675;
  const glitchAt = doneAt - 4 * frame;
  const revealOrder = "31704625";
  const started = performance.now();
  let queuedFrame;

  function finishIntro(landed) {
    root.classList.toggle("intro-landed", landed);
    root.classList.remove("booting");
    cancelAnimationFrame(queuedFrame);
    listeners.abort();
    syncBackgroundMotion();
  }

  function partialWord(order, count) {
    const visible = order.slice(0, count);
    return [...word].map((letter, index) => visible.includes(String(index)) ? letter : " ").join("");
  }

  function playStartup(now) {
    const elapsed = now - started;
    if (elapsed >= doneAt) {
      finishIntro(true);
      return;
    }

    let title = "";
    if (elapsed >= wordAt) {
      const shown = Math.floor((elapsed - wordAt) / (frame * 1.1)) + 1;
      title = shown < word.length ? partialWord(revealOrder, shown) : word;
    }

    if (splashTitle.textContent !== title) splashTitle.textContent = title;
    splashTitle.classList.toggle("glitch", elapsed >= glitchAt && elapsed < doneAt - frame);
    queuedFrame = requestAnimationFrame(playStartup);
  }

  boot.addEventListener("click", () => finishIntro(false), options);
  document.addEventListener("keydown", () => finishIntro(false), options);
  for (const event of ["wheel", "touchmove"]) {
    window.addEventListener(event, () => finishIntro(false), { ...options, passive: true });
  }
  motion.addEventListener("change", () => {
    if (motion.matches) finishIntro(false);
  }, options);
  queuedFrame = requestAnimationFrame(playStartup);
}

const field = document.querySelector(".hero-field");
const orbitalCanvas = field.querySelector("canvas");
const orbitalInk = orbitalCanvas.getContext("2d");
const motionButton = document.querySelector(".motion-toggle");
const turn = 2 * Math.PI;
const orbitSpecs = [
  { diameters: [460, .53, 875], tilt: -23, squash: .72, offset: 108, period: 20, color: "56,133,251" },
  { diameters: [560, .72, 1180], tilt: 20, squash: .64, offset: 240, period: -29, color: "83,216,255", ticks: true },
  { diameters: [680, .88, 1460], tilt: -17, squash: .67, offset: 40, period: 32, color: "34,112,252", ticks: true },
  { diameters: [780, 1.17, 1880], tilt: 17, squash: .60, offset: 207, period: -38, color: "210,138,60" },
];
let rings = [];
let tracks;
let tickMarks;
let heroVisible = true;
let backgroundPaused = false;
let orbitFrame;
let orbitTime = 0;
let lastOrbitStamp;

function drawOrbits() {
  if (!tracks) return;
  orbitalInk.clearRect(0, 0, orbitalCanvas.width, orbitalCanvas.height);
  orbitalInk.lineWidth = .65;
  orbitalInk.strokeStyle = "#30476f89";
  orbitalInk.stroke(tracks);
  orbitalInk.strokeStyle = "#586b9050";
  orbitalInk.stroke(tickMarks);

  orbitalInk.lineWidth = 1.5;
  for (const { x, y, radius, height, rotation, offset, period, color } of rings) {
    const start = (offset / 360 + orbitTime / period - .25 + .56) * turn;
    const end = start + .27 * turn;
    orbitalInk.save();
    orbitalInk.translate(x, y);
    orbitalInk.rotate(rotation);
    const gradient = orbitalInk.createLinearGradient(
      radius * Math.cos(start), height * Math.sin(start),
      radius * Math.cos(end), height * Math.sin(end)
    );
    gradient.addColorStop(0, `rgba(${color},0)`);
    gradient.addColorStop(.36, `rgba(${color},.12)`);
    gradient.addColorStop(.76, `rgba(${color},.54)`);
    gradient.addColorStop(.90, `rgba(${color},.8)`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    orbitalInk.strokeStyle = gradient;
    orbitalInk.beginPath();
    orbitalInk.ellipse(0, 0, radius, height, 0, start, end);
    orbitalInk.stroke();
    orbitalInk.restore();
  }
}

function sizeOrbits() {
  if (!orbitalInk || !orbitalCanvas.clientWidth || !orbitalCanvas.clientHeight) return;

  const { clientWidth, clientHeight } = orbitalCanvas;
  // The background needs only one small surface, even on a high-DPI display.
  const scale = Math.min(devicePixelRatio || 1, 1600 / clientWidth, 900 / clientHeight);
  orbitalCanvas.width = Math.max(1, Math.round(clientWidth * scale));
  orbitalCanvas.height = Math.max(1, Math.round(clientHeight * scale));
  tracks = new Path2D();
  tickMarks = new Path2D();
  rings = orbitSpecs.map((spec) => {
    const [minimum, fraction, maximum] = spec.diameters;
    const diameter = Math.min(maximum, Math.max(minimum, innerWidth * fraction));
    const radius = diameter * scale / 2;
    const height = radius * spec.squash;
    const rotation = spec.tilt / 360 * turn;
    const x = orbitalCanvas.width / 2;
    const y = orbitalCanvas.height * .51;
    tracks.moveTo(x + radius * Math.cos(rotation), y + radius * Math.sin(rotation));
    tracks.ellipse(x, y, radius, height, rotation, 0, turn);

    if (spec.ticks) {
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      for (let step = 0; step < 52; step++) {
        const angle = step / 52 * turn;
        const dx = radius * Math.cos(angle);
        const dy = height * Math.sin(angle);
        const pointX = dx * cos - dy * sin;
        const pointY = dx * sin + dy * cos;
        const tick = 3 * scale / Math.hypot(pointX, pointY);
        tickMarks.moveTo(x + pointX * (1 - tick), y + pointY * (1 - tick));
        tickMarks.lineTo(x + pointX * (1 + tick), y + pointY * (1 + tick));
      }
    }
    return { ...spec, x, y, radius, height, rotation };
  });
  drawOrbits();
}

function animateOrbits(stamp) {
  if (lastOrbitStamp !== undefined) orbitTime += Math.min(stamp - lastOrbitStamp, 100) / 1000;
  lastOrbitStamp = stamp;
  drawOrbits();
  orbitFrame = requestAnimationFrame(animateOrbits);
}

function syncBackgroundMotion() {
  const paused = !heroVisible || backgroundPaused || motion.matches || document.hidden || root.classList.contains("booting");
  field.toggleAttribute("data-paused", paused);
  motionButton.hidden = motion.matches;
  if (paused) {
    cancelAnimationFrame(orbitFrame);
    orbitFrame = undefined;
    lastOrbitStamp = undefined;
  } else if (orbitalInk && orbitFrame === undefined) {
    orbitFrame = requestAnimationFrame(animateOrbits);
  }
}

motionButton.addEventListener("click", () => {
  backgroundPaused = !backgroundPaused;
  motionButton.setAttribute("aria-pressed", backgroundPaused);
  syncBackgroundMotion();
});
motion.addEventListener("change", syncBackgroundMotion);
document.addEventListener("visibilitychange", syncBackgroundMotion);
new ResizeObserver(sizeOrbits).observe(orbitalCanvas);

const orbitVisibility = new IntersectionObserver(([entry]) => {
  heroVisible = entry.isIntersecting;
  syncBackgroundMotion();
});
orbitVisibility.observe(field);
syncBackgroundMotion();

const reveal = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    if (!motion.matches && !entry.target.contains(document.activeElement)) entry.target.classList.add("arrived");
    reveal.unobserve(entry.target);
  }
}, { threshold: .16 });
document.querySelectorAll(".chapter .section-head, .game, .steps li, .play-card, .releases article, .platforms li").forEach((element) => reveal.observe(element));

const header = document.querySelector(".masthead");
const sections = [...header.querySelectorAll(".primary-nav a, .nav-download")].map((link) => ({
  link,
  section: document.querySelector(link.hash),
}));
let activeLink;
let pendingFrame;

function updatePosition() {
  pendingFrame = undefined;
  const viewport = root.clientHeight;
  const scrollable = root.scrollHeight - viewport;
  const progress = scrollable > 0 ? Math.min(1, Math.max(0, scrollY / scrollable)) : 0;
  header.style.setProperty("--progress", progress);
  const cutoff = header.getBoundingClientRect().bottom + 32;
  const active = progress >= .998
    ? sections.at(-1)
    : sections.findLast(({ section }) => section.getBoundingClientRect().top <= cutoff);

  if (activeLink !== active?.link) {
    activeLink?.removeAttribute("aria-current");
    activeLink = active?.link;
    activeLink?.setAttribute("aria-current", "location");
  }
}

function schedulePositionUpdate() {
  if (pendingFrame === undefined) pendingFrame = requestAnimationFrame(updatePosition);
}

window.addEventListener("scroll", schedulePositionUpdate, { passive: true });
window.addEventListener("resize", schedulePositionUpdate);
window.addEventListener("load", schedulePositionUpdate, { once: true });
updatePosition();

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
    const origin = link.dataset.previewSize && !motion.matches && !compactPreview.matches
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

    if (!link.dataset.previewSize || motion.matches) return;
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
motion.addEventListener("change", () => {
  if (motion.matches) clearPreviewMotion();
});
previewDialog.addEventListener("click", (event) => {
  if (event.target === previewDialog) previewDialog.close();
});

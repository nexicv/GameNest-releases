const root = document.documentElement;
const motion = matchMedia("(prefers-reduced-motion: reduce)");

if (root.classList.contains("booting")) {
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  const boot = document.querySelector("#boot");
  const title = document.querySelector("#title");
  const fallback = boot.querySelector(".boot-word");
  const litMask = document.querySelector("#boot-lit");
  const dimMask = document.querySelector("#boot-dim");
  const beat = 1 / 24;
  const wordAt = .24;
  const wordStableAt = wordAt + 12 * beat;
  const revealAt = wordStableAt + .25;
  const navEnd = revealAt + .24;
  const detailsAt = revealAt + .055;
  const finishAt = detailsAt + .23;
  // Each letter lights up on entry, then dims on these offsets without pausing the next letter.
  const schedule = [
    [3, [2, 5]], [1, [2]], [7, [2, 6]], [0, [2, 4]],
    [4, [2]], [6, [2, 5]], [2, [2]], [5, [2, 4]],
  ];
  const exact = value => Number(value.toFixed(5));
  let started;
  let queuedFrame;
  let lastBeat;
  let bounds;

  function finishIntro() {
    clearTimeout(fontWait);
    root.classList.remove("booting", "boot-letter-build", "boot-away");
    root.style.removeProperty("--boot-art-opacity");
    root.style.removeProperty("--boot-nav-progress");
    root.style.removeProperty("--boot-details-progress");
    cancelAnimationFrame(queuedFrame);
    listeners.abort();
    syncBackgroundMotion();
  }

  function trackViewport() {
    // A fixed wordmark preserves the intro on section links and restored scroll positions.
    const rect = title.getBoundingClientRect();
    root.classList.toggle("boot-away", rect.top < 0 || rect.bottom > innerHeight);
    bounds = undefined;
  }

  function getLetterBounds() {
    const word = root.classList.contains("boot-away") ? fallback : title;
    const wordBox = word.getBoundingClientRect();
    return Array.from(word.textContent, (_, index) => {
      const range = document.createRange();
      range.setStart(word.firstChild, index);
      range.setEnd(word.firstChild, index + 1);
      const box = range.getBoundingClientRect();
      return { x: (box.left - wordBox.left) / wordBox.width, width: box.width / wordBox.width };
    });
  }

  function paintBeat(index) {
    const lit = [];
    const dim = [];
    for (const [start, [letter, beats]] of schedule.entries()) {
      const age = index - start;
      if (age < 0) continue;
      const { x, width } = bounds[letter];
      const outline = `M${exact(x)} 0h${exact(width)}v1h${exact(-width)}z`;
      (beats.includes(age) ? dim : lit).push(outline);
    }
    litMask.setAttribute("d", lit.join(""));
    dimMask.setAttribute("d", dim.join(""));
  }

  function easeBetween(t, start, end) {
    const value = Math.min(1, Math.max(0, (t - start) / (end - start)));
    return value * value * (3 - 2 * value);
  }

  function playStartup(now) {
    const elapsed = (now - started) / 1000;
    if (elapsed >= finishAt) {
      finishIntro();
      return;
    }
    root.classList.toggle("boot-letter-build", elapsed < wordStableAt);
    const index = Math.floor((elapsed - wordAt) / beat + 1e-7);
    if (index !== lastBeat || !bounds) {
      bounds ??= getLetterBounds();
      paintBeat(index);
      lastBeat = index;
    }
    root.style.setProperty("--boot-art-opacity", exact(easeBetween(elapsed, revealAt, finishAt)));
    root.style.setProperty("--boot-nav-progress", exact(easeBetween(elapsed, revealAt, navEnd)));
    root.style.setProperty("--boot-details-progress", exact(easeBetween(elapsed, detailsAt, finishAt)));
    queuedFrame = requestAnimationFrame(playStartup);
  }

  boot.addEventListener("click", finishIntro, options);
  document.addEventListener("keydown", finishIntro, options);
  for (const event of ["wheel", "touchmove"]) {
    window.addEventListener(event, finishIntro, { ...options, passive: true });
  }
  for (const event of ["resize", "scroll"]) {
    window.addEventListener(event, trackViewport, { ...options, passive: true });
  }
  motion.addEventListener("change", () => {
    if (motion.matches) finishIntro();
  }, options);
  trackViewport();
  const fontWait = setTimeout(finishIntro, 750);
  document.fonts.ready.then(() => {
    if (options.signal.aborted) return;
    clearTimeout(fontWait);
    if (motion.matches) {
      finishIntro();
      return;
    }
    trackViewport();
    started = performance.now();
    queuedFrame = requestAnimationFrame(playStartup);
  });
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

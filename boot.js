// Runs before first paint (loaded without defer) so the boot animation
// classes are set before the page renders. Kept out of index.html for the CSP.
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("booting", "boot-letter-build");
  if (location.hash && location.hash !== "#top") {
    document.documentElement.classList.add("boot-away");
  }
}

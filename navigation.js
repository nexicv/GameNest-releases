const resources = document.querySelector(".nav-resources");
const resourcesToggle = resources.querySelector("summary");
document.addEventListener("click", (event) => {
  if (!resources.open) return;
  if (!resources.contains(event.target)) resources.open = false;
});
document.addEventListener("focusin", (event) => {
  if (!resources.contains(event.target)) resources.open = false;
});
resources.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !resources.open) return;
  resources.open = false;
  resourcesToggle.focus();
});
window.addEventListener("pagehide", () => {
  resources.open = false;
});

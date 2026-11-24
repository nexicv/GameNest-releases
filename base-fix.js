// 404 page: point <base> at the right root on github.io or file:// previews.
// Loaded without defer, before the stylesheet. Kept out of 404.html for the CSP.
const base = document.querySelector("base");
if (location.hostname === "nexicv.github.io") base.href = "/GameNest-releases/";
if (location.protocol === "file:") base.href = "./";

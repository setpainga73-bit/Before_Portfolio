(() => {
  let theme;
  try {
    theme =
      localStorage.getItem("asp-theme") ||
      (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  } catch {
    theme = matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  document.documentElement.dataset.theme = theme;
  document.querySelector("#theme-color-meta").content =
    theme === "light" ? "#eef1f8" : "#0b1020";
})();
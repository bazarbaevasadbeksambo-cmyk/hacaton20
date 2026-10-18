// Shared by the server layout (inline script) and the client theme store, so no "use client" here.

export const THEME_KEY = "daftar.theme";

/** Runs inline in <head> before first paint: stored choice, else the system preference. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})();`;

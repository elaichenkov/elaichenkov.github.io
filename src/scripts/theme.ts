// Constants
const THEME = "theme";
const PALETTE = "palette";
const LIGHT = "light";
const DARK = "dark";
const DEFAULT_PALETTE = "fjord";

// Initial color scheme
// Can be "light", "dark", or empty string for system's prefers-color-scheme
const initialColorScheme = "";

function getPreferTheme(): string {
  // get theme data from local storage (user's explicit choice)
  const currentTheme = localStorage.getItem(THEME);
  if (currentTheme) return currentTheme;

  // return initial color scheme if it is set (site default)
  if (initialColorScheme) return initialColorScheme;

  // return user device's prefer color scheme (system fallback)
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? DARK
    : LIGHT;
}

function getPreferPalette(): string {
  const currentPalette = localStorage.getItem(PALETTE);
  return currentPalette || window.theme?.paletteValue || DEFAULT_PALETTE;
}

// Use existing theme value from inline script if available, otherwise detect
let themeValue = window.theme?.themeValue ?? getPreferTheme();
let paletteValue = window.theme?.paletteValue ?? getPreferPalette();

function setPreference(): void {
  localStorage.setItem(THEME, themeValue);
  localStorage.setItem(PALETTE, paletteValue);
  reflectPreference();
}

function reflectPreference(): void {
  document.firstElementChild?.setAttribute("data-theme", themeValue);
  document.firstElementChild?.setAttribute("data-palette", paletteValue);

  document.querySelector("#theme-btn")?.setAttribute("aria-label", themeValue);
  const paletteSelect = document.querySelector(
    "#palette-select"
  ) as HTMLSelectElement | null;
  if (paletteSelect) paletteSelect.value = paletteValue;

  // Get a reference to the body element
  const body = document.body;

  // Check if the body element exists before using getComputedStyle
  if (body) {
    // Get the computed styles for the body element
    const computedStyles = window.getComputedStyle(body);

    // Get the background color property
    const bgColor = computedStyles.backgroundColor;

    // Set the background color in <meta theme-color ... />
    document
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", bgColor);
  }
}

// Update the global theme API
if (window.theme) {
  window.theme.setPreference = setPreference;
  window.theme.reflectPreference = reflectPreference;
} else {
  window.theme = {
    themeValue,
    paletteValue,
    setPreference,
    reflectPreference,
    getTheme: () => themeValue,
    setTheme: (val: string) => {
      themeValue = val;
    },
    getPalette: () => paletteValue,
    setPalette: (val: string) => {
      paletteValue = val;
    },
  };
}

// Ensure theme is reflected (in case body wasn't ready when inline script ran)
reflectPreference();

function setThemeFeature(): void {
  // set on load so screen readers can get the latest value on the button
  reflectPreference();

  // now this script can find and listen for clicks on the control
  const themeBtn = document.querySelector("#theme-btn") as
    | HTMLButtonElement
    | null;
  if (themeBtn) {
    themeBtn.onclick = () => {
      themeValue = themeValue === LIGHT ? DARK : LIGHT;
      window.theme?.setTheme(themeValue);
      setPreference();
    };
  }
}

function setPaletteFeature(): void {
  const paletteSelect = document.querySelector(
    "#palette-select"
  ) as HTMLSelectElement | null;
  if (paletteSelect) {
    paletteSelect.onchange = () => {
      paletteValue = paletteSelect.value;
      window.theme?.setPalette(paletteValue);
      setPreference();
    };
  }
}

function setupThemeControls(): void {
  setThemeFeature();
  setPaletteFeature();
}

// Set up theme features after page load
setupThemeControls();

// Runs on view transitions navigation
document.addEventListener("astro:after-swap", setupThemeControls);

// Set theme-color value before page transition
// to avoid navigation bar color flickering in Android dark mode
document.addEventListener("astro:before-swap", event => {
  const astroEvent = event;
  const bgColor = document
    .querySelector("meta[name='theme-color']")
    ?.getAttribute("content");

  if (bgColor) {
    astroEvent.newDocument
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", bgColor);
  }
});

// sync with system changes
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", ({ matches: isDark }) => {
    themeValue = isDark ? DARK : LIGHT;
    window.theme?.setTheme(themeValue);
    setPreference();
  });

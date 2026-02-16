interface Window {
  theme?: {
    themeValue: string;
    paletteValue: string;
    setPreference: () => void;
    reflectPreference: () => void;
    getTheme: () => string;
    setTheme: (val: string) => void;
    getPalette: () => string;
    setPalette: (val: string) => void;
  };
}

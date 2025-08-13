export interface FontOption {
  name: string;
  value: string;
  isGoogleFont?: boolean;
}

// System fonts with fallback stacks
const SYSTEM_FONTS: FontOption[] = [
  { name: 'Sans Serif', value: 'Arial, Helvetica, sans-serif' },
  { name: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { name: 'Monospace', value: '"Courier New", Courier, monospace' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
];

// Popular Google Fonts
const GOOGLE_FONTS: FontOption[] = [
  { name: 'Open Sans', value: '"Open Sans", sans-serif', isGoogleFont: true },
  { name: 'Roboto', value: 'Roboto, sans-serif', isGoogleFont: true },
  { name: 'Lato', value: 'Lato, sans-serif', isGoogleFont: true },
  { name: 'Montserrat', value: 'Montserrat, sans-serif', isGoogleFont: true },
  { name: 'Poppins', value: 'Poppins, sans-serif', isGoogleFont: true },
];

export const FONT_OPTIONS = [...SYSTEM_FONTS, ...GOOGLE_FONTS];
export const DEFAULT_FONT = SYSTEM_FONTS[0].value;

// Load Google Font dynamically
export function loadGoogleFont(fontName: string): void {
  const existingLink = document.querySelector(`link[href*="${fontName.replace(' ', '+')}"]`);
  if (existingLink) return;

  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@400;700&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

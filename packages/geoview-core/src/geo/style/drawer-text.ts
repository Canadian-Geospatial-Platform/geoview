import { Text } from 'ol/style';
import type { Options as TextOptions } from 'ol/style/Text';
import type Fill from 'ol/style/Fill';
import type Stroke from 'ol/style/Stroke';

/** Extended Text options to include text formatting properties */
export interface DrawerTextOptions extends TextOptions {
  /** The text content to display */
  text: string | string[] | undefined;

  /** The fill style for the text */
  fill: Fill;

  /** The stroke (outline) style for the text */
  stroke?: Stroke;

  /** Whether the text should be bold */
  bold?: boolean;

  /** Whether the text should be italic */
  italic?: boolean;

  /** The font size in pixels */
  size?: number;

  /** The font family name */
  fontFamily?: string;
}

/**
 * Extended Text class that preserves text formatting properties.
 *
 * OpenLayers Text encodes bold/italic/size/font into a CSS font string,
 * making it difficult to extract individual properties later.
 * This class stores those values as metadata for easy retrieval.
 */
export class DrawerText extends Text {
  /** Whether the text is bold */
  #bold: boolean;

  /** Whether the text is italic */
  #italic: boolean;

  /** The font size in pixels */
  #size: number;

  /** The font family name */
  #fontFamily: string;

  /** Base text size in pixels */
  static readonly BASE_TEXT_SIZE = 14;

  /**
   * Creates a DrawerText instance.
   *
   * @param options - Text options extended with formatting metadata
   */
  constructor(options: DrawerTextOptions) {
    const { bold, italic, size, fontFamily, rotation, ...textOptions } = options;

    // Build the CSS font string for OpenLayers
    const fontString = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${size}px ${fontFamily}`;
    super({ ...textOptions, font: fontString, rotation: rotation ?? 0 });

    this.#bold = bold || false;
    this.#italic = italic || false;
    this.#size = size || DrawerText.BASE_TEXT_SIZE;
    this.#fontFamily = fontFamily || 'sans-serif';
  }

  /**
   * Gets whether the text is bold.
   *
   * @returns True if the text is bold
   */
  getBold(): boolean {
    return this.#bold;
  }

  /**
   * Sets whether the text is bold.
   *
   * @param bold - Whether the text should be bold
   */
  setBold(bold: boolean): void {
    this.#bold = bold;
    this.#regenerateFont();
  }

  /**
   * Gets whether the text is italic.
   *
   * @returns True if the text is italic
   */
  getItalic(): boolean {
    return this.#italic;
  }

  /**
   * Sets whether the text is italic.
   *
   * @param italic - Whether the text should be italic
   */
  setItalic(italic: boolean): void {
    this.#italic = italic;
    this.#regenerateFont();
  }

  /**
   * Gets the font size in pixels.
   *
   * @returns The font size
   */
  getSize(): number {
    return this.#size;
  }

  /**
   * Sets the font size in pixels.
   *
   * @param size - The font size in pixels
   */
  setSize(size: number): void {
    this.#size = size;
    this.#regenerateFont();
  }

  /**
   * Gets the font family name.
   *
   * Note: Use getFont() to get the full CSS font string.
   *
   * @returns The font family
   */
  getFontFamily(): string {
    return this.#fontFamily;
  }

  /**
   * Sets the font family name.
   *
   * @param fontFamily - The font family name
   */
  setFontFamily(fontFamily: string): void {
    this.#fontFamily = fontFamily;
    this.#regenerateFont();
  }

  /**
   * Regenerates the CSS font string based on the current metadata.
   */
  #regenerateFont(): void {
    const fontString = `${this.#italic ? 'italic ' : ''}${this.#bold ? 'bold ' : ''}${this.#size}px ${this.#fontFamily}`;
    this.setFont(fontString);
  }
}

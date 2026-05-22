import { Style } from 'ol/style';
import type { Options as StyleOptions } from 'ol/style/Style';
import { DrawerText } from './drawer-text';
import { DrawerIcon } from './drawer-icon';

/**
 * Custom Style class for drawer features that tracks DrawerText and DrawerIcon instances.
 */
export class DrawerStyle extends Style {
  /** Reference to DrawerText if this is a text style */
  #drawerText?: DrawerText;

  /** Reference to DrawerIcon if this is an icon style */
  #drawerIcon?: DrawerIcon;

  constructor(options?: StyleOptions) {
    super(options);

    // Capture DrawerText reference if provided
    if (options?.text instanceof DrawerText) {
      this.#drawerText = options.text;
    }

    // Capture DrawerIcon reference if provided
    if (options?.image instanceof DrawerIcon) {
      this.#drawerIcon = options.image;
    }
  }

  /**
   * Gets the DrawerText instance if this is a text style.
   *
   * @returns The DrawerText instance or undefined
   */
  getDrawerText(): DrawerText | undefined {
    return this.#drawerText;
  }

  /**
   * Gets the DrawerIcon instance if this is an icon style.
   *
   * @returns The DrawerIcon instance or undefined
   */
  getDrawerIcon(): DrawerIcon | undefined {
    return this.#drawerIcon;
  }

  /**
   * Checks if this is a text style.
   *
   * @returns True if this style contains DrawerText
   */
  isTextStyle(): boolean {
    return this.#drawerText !== undefined;
  }

  /**
   * Checks if this is an icon style.
   *
   * @returns True if this style contains DrawerIcon
   */
  isIconStyle(): boolean {
    return this.#drawerIcon !== undefined;
  }

  // #region Overrides

  /**
   * Override the clone method to ensure proper type.
   *
   * @returns A cloned DrawerStyle instance
   */
  override clone(): DrawerStyle {
    return super.clone() as DrawerStyle;
  }

  // #endregion

  // #region Text property delegation

  /**
   * Gets the text content.
   *
   * @returns The text content or undefined
   */
  getTextContent(): string | string[] {
    return this.#drawerText?.getText() || 'Text';
  }

  /**
   * Gets the text size.
   *
   * @returns The text size in pixels or undefined
   */
  getTextSize(): number {
    return this.#drawerText?.getSize() || 14;
  }

  /**
   * Gets the text bold state.
   *
   * @returns True if bold, false otherwise, or undefined
   */
  getTextBold(): boolean {
    return this.#drawerText?.getBold() || false;
  }

  /**
   * Gets the text italic state.
   *
   * @returns True if italic, false otherwise, or undefined
   */
  getTextItalic(): boolean {
    return this.#drawerText?.getItalic() || false;
  }

  /**
   * Gets the text rotation angle.
   *
   * @returns The rotation angle in radians or undefined
   */
  getTextRotation(): number {
    return this.#drawerText?.getRotation() || 0;
  }

  /**
   * Gets the text font family.
   *
   * @returns The font family name or undefined
   */
  getTextFontFamily(): string {
    return this.#drawerText?.getFontFamily() || 'sans-serif';
  }

  /**
   * Gets the text fill color.
   *
   * @returns The text color or undefined
   */
  getTextColor(): string {
    return (this.#drawerText?.getFill()?.getColor() as string) || '#000000';
  }

  /**
   * Gets the text halo (stroke) color.
   *
   * @returns The halo color or undefined
   */
  getTextHaloColor(): string {
    return (this.#drawerText?.getStroke()?.getColor() as string) || 'rgba(255,255,255,0.7)';
  }

  /**
   * Gets the text halo (stroke) width.
   *
   * @returns The halo width or undefined
   */
  getTextHaloWidth(): number {
    return this.#drawerText?.getStroke()?.getWidth() || 3;
  }

  // #endregion

  // #region Icon property delegation

  /**
   * Gets the icon source URL.
   *
   * @returns The icon source or undefined
   */
  getIconSrc(): string | undefined {
    return this.#drawerIcon?.getSrc();
  }

  /**
   * Gets the icon size.
   *
   * @returns The icon size in pixels or undefined
   */
  getIconSize(): number | undefined {
    return this.#drawerIcon?.getIconSize();
  }

  /**
   * Gets the icon stroke color.
   *
   * @returns The stroke color or undefined
   */
  getIconStrokeColor(): string | undefined {
    return this.#drawerIcon?.getStrokeColor();
  }

  /**
   * Gets the icon stroke width.
   *
   * @returns The stroke width or undefined
   */
  getIconStrokeWidth(): number | undefined {
    return this.#drawerIcon?.getStrokeWidth();
  }

  /**
   * Gets the icon fill color.
   *
   * @returns The fill color or undefined
   */
  getIconFillColor(): string | undefined {
    return this.#drawerIcon?.getFillColor();
  }

  // #endregion
}

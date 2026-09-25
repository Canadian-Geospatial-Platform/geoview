import type Feature from 'ol/Feature';
import type { Extent } from 'ol/extent';
import { Point } from 'ol/geom';
import { Style } from 'ol/style';
import type { Options as StyleOptions, StyleLike } from 'ol/style/Style';
import type { DrawerStyleProperties } from '@/core/types/drawer-types';
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

  /**
   * Extracts drawer style properties from a feature.
   *
   * @param feature - The feature to extract properties from
   * @returns The extracted style properties
   */
  static getFeatureStyleProperties(feature: Feature): DrawerStyleProperties {
    return this.getStyleProperties(feature.getStyle() as DrawerStyle);
  }

  /**
   * Extracts drawer style properties from a style object.
   *
   * @param style - The style object to extract properties from
   * @returns The extracted style properties
   */
  static getStyleProperties(style: DrawerStyle): DrawerStyleProperties {
    const styleProps: DrawerStyleProperties = {} as DrawerStyleProperties;

    if (style) {
      const stroke = style.getStroke();
      const fill = style.getFill();

      if (stroke) {
        styleProps.strokeColor = stroke.getColor() as string;
        styleProps.strokeWidth = stroke.getWidth() || 1.3;
      }

      if (fill) {
        styleProps.fillColor = fill.getColor() as string;
      }

      if (style.isTextStyle()) {
        styleProps.text = style.getTextContent();
        styleProps.textBold = style.getTextBold();
        styleProps.textItalic = style.getTextItalic();
        styleProps.textSize = style.getTextSize();
        styleProps.textFont = style.getTextFontFamily();
        styleProps.textColor = style.getTextColor();
        styleProps.textHaloColor = style.getTextHaloColor();
        styleProps.textHaloWidth = style.getTextHaloWidth();
        styleProps.textRotation = style.getTextRotation();
      }

      if (style.isIconStyle()) {
        styleProps.iconSrc = style.getIconSrc();
        styleProps.strokeColor = style.getIconStrokeColor() ?? styleProps.strokeColor;
        styleProps.strokeWidth = style.getIconStrokeWidth() ?? styleProps.strokeWidth;
        styleProps.fillColor = style.getIconFillColor() ?? styleProps.fillColor;
        styleProps.iconSize = style.getIconSize();
      }
    }

    return styleProps;
  }

  /**
   * Checks if a feature has a drawer text style.
   *
   * @param feature - The feature to check
   * @returns Whether the feature has a drawer text style
   */
  static isTextFeature(feature: Feature): boolean {
    const style = feature.getStyle();
    return style instanceof DrawerStyle && style.isTextStyle();
  }

  /**
   * Compares two drawer styles by their extracted properties.
   *
   * @param style1 - First style to compare
   * @param style2 - Second style to compare
   * @returns Whether the styles have different properties
   */
  static stylesAreDifferent(style1: StyleLike | undefined, style2: StyleLike | undefined): boolean {
    if (style1 === style2) return false;
    if (!style1 || !style2) return true;
    if (!(style1 instanceof DrawerStyle) || !(style2 instanceof DrawerStyle)) return true;

    const props1 = this.getStyleProperties(style1);
    const props2 = this.getStyleProperties(style2);

    return JSON.stringify(props1) !== JSON.stringify(props2);
  }

  /**
   * Clones a drawer style or array of drawer styles.
   *
   * @param styleLike - The style or array of styles to clone
   * @returns A cloned drawer style or array of cloned drawer styles
   * @throws {Error} When the style-like value cannot be cloned as a drawer style
   */
  static cloneStyle(styleLike: StyleLike): DrawerStyle | DrawerStyle[] {
    if (styleLike instanceof Style) return (styleLike as DrawerStyle).clone();
    if (Array.isArray(styleLike)) return styleLike.map((style) => (style as DrawerStyle).clone());
    throw new Error('Unsupported StyleLike type');
  }

  /**
   * Calculates the visual map extent of a text feature.
   *
   * @param feature - The text feature to measure
   * @param resolution - The current map resolution
   * @returns The text extent, or null when the feature is not a text point
   */
  static calculateTextExtent(feature: Feature, resolution: number): Extent | null {
    const geometry = feature.getGeometry();
    if (!(geometry instanceof Point)) return null;

    const coords = geometry.getCoordinates();
    const style = feature.getStyle();
    if (!(style instanceof DrawerStyle) || !style.isTextStyle()) return null;

    const text = style.getTextContent();
    const fontSize = style.getTextSize();
    const charWidth = fontSize * 0.6;
    const textWidth = text.length * charWidth;
    const textHeight = fontSize * 1.2;

    const mapWidth = textWidth * resolution;
    const mapHeight = textHeight * resolution;

    const textCenterY = coords[1];
    const textLeft = coords[0] - mapWidth / 2.5;
    const textRight = coords[0] + mapWidth / 2.5;
    const textBottom = textCenterY - mapHeight / 1.25;
    const textTop = textCenterY + mapHeight / 1.25;

    return [textLeft, textBottom, textRight, textTop];
  }

  // #region OVERRIDES

  /**
   * Override the clone method to ensure proper type.
   *
   * @returns A cloned DrawerStyle instance
   */
  override clone(): DrawerStyle {
    return super.clone() as DrawerStyle;
  }

  // #endregion OVERRIDES

  // #region TEXT PROPERTY DELEGATION

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

  // #endregion TEXT PROPERTY DELEGATION

  // #region ICON PROPERTY DELEGATION

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

  // #endregion ICON PROPERTY DELEGATION
}

import { Icon as OLIcon } from 'ol/style';
import type { Options as IconOptions } from 'ol/style/Icon';

/** Extended icon options that include stroke and fill metadata */
export interface DrawerIconOptions extends IconOptions {
  /** The stroke color used in the icon's SVG */
  strokeColor: string;

  /** The stroke width used in the icon's SVG */
  strokeWidth: number;

  /** The fill color used in the icon's SVG */
  fillColor: string;
}

/**
 * Extended Icon class that preserves stroke and fill colors used in SVG generation.
 *
 * OpenLayers Icon styles render SVGs as images, losing the original stroke/fill information.
 * This class stores those values as metadata so they can be retrieved later.
 */
export class DrawerIcon extends OLIcon {
  /** The stroke color used in the icon's SVG */
  #strokeColor?: string;

  /** The stroke width used in the icon's SVG */
  #strokeWidth?: number;

  /** The fill color used in the icon's SVG */
  #fillColor?: string;

  /** Base icon size used for scale calculations */
  static readonly BASE_ICON_SIZE: number = 24;

  /**
   * Creates a DrawerIcon instance.
   *
   * @param options - Icon options extended with stroke/fill metadata
   */
  constructor(options: DrawerIconOptions) {
    const { strokeColor, strokeWidth, fillColor, ...iconOptions } = options;
    super(iconOptions);

    this.#strokeColor = strokeColor || '#000000';
    this.#strokeWidth = strokeWidth || 1.3;
    this.#fillColor = fillColor || '#ffffff';
  }

  /**
   * Gets the stroke color.
   *
   * @returns The stroke color, or undefined if not set
   */
  getStrokeColor(): string | undefined {
    return this.#strokeColor;
  }

  /**
   * Sets the stroke color.
   *
   * @param color - The stroke color value
   */
  setStrokeColor(color: string): void {
    this.#strokeColor = color;
  }

  /**
   * Gets the stroke width.
   *
   * @returns The stroke width, or undefined if not set
   */
  getStrokeWidth(): number | undefined {
    return this.#strokeWidth;
  }

  /**
   * Sets the stroke width.
   *
   * @param width - The stroke width value in pixels
   */
  setStrokeWidth(width: number): void {
    this.#strokeWidth = width;
  }

  /**
   * Gets the fill color.
   *
   * @returns The fill color, or undefined if not set
   */
  getFillColor(): string | undefined {
    return this.#fillColor;
  }

  /**
   * Sets the fill color.
   *
   * @param color - The fill color value
   */
  setFillColor(color: string): void {
    this.#fillColor = color;
  }

  /**
   * Gets the icon size in pixels.
   *
   * This method handles both uniform scale (number) and separate X/Y scales (array),
   * always returning a single size value by multiplying the scale by the base icon size.
   *
   * @returns The icon size in pixels, or undefined if scale is not set
   */
  getIconSize(): number | undefined {
    const scale = this.getScale();
    if (scale === undefined) return undefined;

    // Handle both number and [number, number] scale values
    const scaleValue = typeof scale === 'number' ? scale : scale[0];
    return scaleValue * DrawerIcon.BASE_ICON_SIZE;
  }
}

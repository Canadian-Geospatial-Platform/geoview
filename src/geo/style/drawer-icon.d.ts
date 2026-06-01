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
export declare class DrawerIcon extends OLIcon {
    #private;
    /** Base icon size used for scale calculations */
    static readonly BASE_ICON_SIZE: number;
    /**
     * Creates a DrawerIcon instance.
     *
     * @param options - Icon options extended with stroke/fill metadata
     */
    constructor(options: DrawerIconOptions);
    /**
     * Gets the stroke color.
     *
     * @returns The stroke color, or undefined if not set
     */
    getStrokeColor(): string | undefined;
    /**
     * Sets the stroke color.
     *
     * @param color - The stroke color value
     */
    setStrokeColor(color: string): void;
    /**
     * Gets the stroke width.
     *
     * @returns The stroke width, or undefined if not set
     */
    getStrokeWidth(): number | undefined;
    /**
     * Sets the stroke width.
     *
     * @param width - The stroke width value in pixels
     */
    setStrokeWidth(width: number): void;
    /**
     * Gets the fill color.
     *
     * @returns The fill color, or undefined if not set
     */
    getFillColor(): string | undefined;
    /**
     * Sets the fill color.
     *
     * @param color - The fill color value
     */
    setFillColor(color: string): void;
    /**
     * Gets the icon size in pixels.
     *
     * This method handles both uniform scale (number) and separate X/Y scales (array),
     * always returning a single size value by multiplying the scale by the base icon size.
     *
     * @returns The icon size in pixels, or undefined if scale is not set
     */
    getIconSize(): number | undefined;
}
//# sourceMappingURL=drawer-icon.d.ts.map
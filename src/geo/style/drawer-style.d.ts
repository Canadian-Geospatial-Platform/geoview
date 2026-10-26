import type Feature from 'ol/Feature';
import type { Extent } from 'ol/extent';
import { Style } from 'ol/style';
import type { Options as StyleOptions, StyleLike } from 'ol/style/Style';
import type { DrawerStyleProperties } from '@/core/types/drawer-types';
import { DrawerText } from './drawer-text';
import { DrawerIcon } from './drawer-icon';
/**
 * Custom Style class for drawer features that tracks DrawerText and DrawerIcon instances.
 */
export declare class DrawerStyle extends Style {
    #private;
    constructor(options?: StyleOptions);
    /**
     * Gets the DrawerText instance if this is a text style.
     *
     * @returns The DrawerText instance or undefined
     */
    getDrawerText(): DrawerText | undefined;
    /**
     * Gets the DrawerIcon instance if this is an icon style.
     *
     * @returns The DrawerIcon instance or undefined
     */
    getDrawerIcon(): DrawerIcon | undefined;
    /**
     * Checks if this is a text style.
     *
     * @returns True if this style contains DrawerText
     */
    isTextStyle(): boolean;
    /**
     * Checks if this is an icon style.
     *
     * @returns True if this style contains DrawerIcon
     */
    isIconStyle(): boolean;
    /**
     * Extracts drawer style properties from a feature.
     *
     * @param feature - The feature to extract properties from
     * @returns The extracted style properties
     */
    static getFeatureStyleProperties(feature: Feature): DrawerStyleProperties;
    /**
     * Extracts drawer style properties from a style object.
     *
     * @param style - The style object to extract properties from
     * @returns The extracted style properties
     */
    static getStyleProperties(style: DrawerStyle): DrawerStyleProperties;
    /**
     * Checks if a feature has a drawer text style.
     *
     * @param feature - The feature to check
     * @returns Whether the feature has a drawer text style
     */
    static isTextFeature(feature: Feature): boolean;
    /**
     * Compares two drawer styles by their extracted properties.
     *
     * @param style1 - First style to compare
     * @param style2 - Second style to compare
     * @returns Whether the styles have different properties
     */
    static stylesAreDifferent(style1: StyleLike | undefined, style2: StyleLike | undefined): boolean;
    /**
     * Clones a drawer style or array of drawer styles.
     *
     * @param styleLike - The style or array of styles to clone
     * @returns A cloned drawer style or array of cloned drawer styles
     * @throws {Error} When the style-like value cannot be cloned as a drawer style
     */
    static cloneStyle(styleLike: StyleLike): DrawerStyle | DrawerStyle[];
    /**
     * Calculates the visual map extent of a text feature.
     *
     * @param feature - The text feature to measure
     * @param resolution - The current map resolution
     * @returns The text extent, or null when the feature is not a text point
     */
    static calculateTextExtent(feature: Feature, resolution: number): Extent | null;
    /**
     * Override the clone method to ensure proper type.
     *
     * @returns A cloned DrawerStyle instance
     */
    clone(): DrawerStyle;
    /**
     * Gets the text content.
     *
     * @returns The text content or undefined
     */
    getTextContent(): string | string[];
    /**
     * Gets the text size.
     *
     * @returns The text size in pixels or undefined
     */
    getTextSize(): number;
    /**
     * Gets the text bold state.
     *
     * @returns True if bold, false otherwise, or undefined
     */
    getTextBold(): boolean;
    /**
     * Gets the text italic state.
     *
     * @returns True if italic, false otherwise, or undefined
     */
    getTextItalic(): boolean;
    /**
     * Gets the text rotation angle.
     *
     * @returns The rotation angle in radians or undefined
     */
    getTextRotation(): number;
    /**
     * Gets the text font family.
     *
     * @returns The font family name or undefined
     */
    getTextFontFamily(): string;
    /**
     * Gets the text fill color.
     *
     * @returns The text color or undefined
     */
    getTextColor(): string;
    /**
     * Gets the text halo (stroke) color.
     *
     * @returns The halo color or undefined
     */
    getTextHaloColor(): string;
    /**
     * Gets the text halo (stroke) width.
     *
     * @returns The halo width or undefined
     */
    getTextHaloWidth(): number;
    /**
     * Gets the icon source URL.
     *
     * @returns The icon source or undefined
     */
    getIconSrc(): string | undefined;
    /**
     * Gets the icon size.
     *
     * @returns The icon size in pixels or undefined
     */
    getIconSize(): number | undefined;
    /**
     * Gets the icon stroke color.
     *
     * @returns The stroke color or undefined
     */
    getIconStrokeColor(): string | undefined;
    /**
     * Gets the icon stroke width.
     *
     * @returns The stroke width or undefined
     */
    getIconStrokeWidth(): number | undefined;
    /**
     * Gets the icon fill color.
     *
     * @returns The fill color or undefined
     */
    getIconFillColor(): string | undefined;
}
//# sourceMappingURL=drawer-style.d.ts.map
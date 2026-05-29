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
export declare class DrawerText extends Text {
    #private;
    /** Base text size in pixels */
    static readonly BASE_TEXT_SIZE = 14;
    /**
     * Creates a DrawerText instance.
     *
     * @param options - Text options extended with formatting metadata
     */
    constructor(options: DrawerTextOptions);
    /**
     * Gets whether the text is bold.
     *
     * @returns True if the text is bold
     */
    getBold(): boolean;
    /**
     * Sets whether the text is bold.
     *
     * @param bold - Whether the text should be bold
     */
    setBold(bold: boolean): void;
    /**
     * Gets whether the text is italic.
     *
     * @returns True if the text is italic
     */
    getItalic(): boolean;
    /**
     * Sets whether the text is italic.
     *
     * @param italic - Whether the text should be italic
     */
    setItalic(italic: boolean): void;
    /**
     * Gets the font size in pixels.
     *
     * @returns The font size
     */
    getSize(): number;
    /**
     * Sets the font size in pixels.
     *
     * @param size - The font size in pixels
     */
    setSize(size: number): void;
    /**
     * Gets the font family name.
     *
     * Note: Use getFont() to get the full CSS font string.
     *
     * @returns The font family
     */
    getFontFamily(): string;
    /**
     * Sets the font family name.
     *
     * @param fontFamily - The font family name
     */
    setFontFamily(fontFamily: string): void;
}
//# sourceMappingURL=drawer-text.d.ts.map
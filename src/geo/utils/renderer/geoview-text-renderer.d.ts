import { Text } from 'ol/style';
import type { FeatureLike } from 'ol/Feature';
import type { TypeLayerStyleSettings, TypeLayerStyleConfig, TypeLayerTextConfig, TypeAliasLookup } from '@/api/types/map-schema-types';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
export declare class GeoviewTextRenderer {
    /**
     * This method returns true if a style config has a text configuration
     *
     * @param layerStyle - The layer style
     * @returns If the style has a text config
     */
    static hasStyleText(layerStyle?: TypeLayerStyleConfig): boolean;
    /**
     * Check if decluttering should be enabled for the text layer
     *
     * @param layerConfig - The layer configuration
     * @returns Whether decluttering should be enabled
     */
    static shouldEnableDeclutter(layerConfig: VectorLayerEntryConfig): boolean;
    /**
     * Method for getting the text style
     *
     * @param feature - The feature to get the text style for
     * @param styleSettings - The style settings
     * @param layerText - The layer text configuration
     * @param aliasLookup - The alias lookup
     * @returns The text style or undefined if no text style should be applied
     */
    static getTextStyle: (feature: FeatureLike, styleSettings: TypeLayerStyleSettings, layerText?: TypeLayerTextConfig, aliasLookup?: TypeAliasLookup) => Text | undefined;
    /**
     * Method for creating Text Style
     *
     * @param feature - The feature to create the text style for
     * @param textSettings - The text style settings
     * @returns The text style or undefined if no text style should be applied
     */
    static createTextStyle: (feature: FeatureLike, textSettings: TypeLayerTextConfig) => Text | undefined;
    /**
     * Wrap text to fit within specified constraints
     *
     * @param str - The text to wrap
     * @param width - The maximum width per line
     * @param maxLines - Maximum number of lines (optional, overrides width if needed)
     * @returns The wrapped text
     */
    static wrapText(str: string, width: number, maxLines?: number): string;
    /**
     * Wrap text to a specified width using word boundaries
     *
     * @param str - The text to wrap
     * @param width - The maximum width of each line
     * @returns The wrapped text
     */
    static wrapTextByWidth(str: string, width: number): string;
    /**
     * Process text template by replacing field placeholders with feature values.
     *
     * Expects somewhat clean field names, so we shouldn't need to worry about escaping special characters
     * (Dates may still have characters after the colon).
     *
     * @param template - The text template with {field-name} placeholders
     * @param feature - The feature to get field values from
     * @returns The processed text with field values substituted
     */
    static processTextTemplate(template: string, feature: FeatureLike): string;
}
//# sourceMappingURL=geoview-text-renderer.d.ts.map
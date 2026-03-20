import { Stroke, Fill, Text } from 'ol/style';
import type { FeatureLike } from 'ol/Feature';
import type Feature from 'ol/Feature';

import type { TypeLayerStyleSettings, TypeLayerStyleConfig, TypeLayerTextConfig, TypeAliasLookup } from '@/api/types/map-schema-types';
import { logger } from '@/core/utils/logger';
import { DateMgt } from '@/core/utils/date-mgt';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';

export class GeoviewTextRenderer {
  /**
   * This method returns true if a style config has a text configuration
   *
   * @param layerStyle - The layer style
   * @returns If the style has a text config
   */
  static hasStyleText(layerStyle?: TypeLayerStyleConfig): boolean {
    if (!layerStyle) return false;
    return Object.values(layerStyle).some((style) => style.info.some((info) => !!info.text));
  }

  /**
   * Check if decluttering should be enabled for the text layer
   *
   * @param layerConfig - The layer configuration
   * @returns Whether decluttering should be enabled
   */
  static shouldEnableDeclutter(layerConfig: VectorLayerEntryConfig): boolean {
    // Check layer-wide text config
    const layerText = layerConfig.getLayerText();
    if (layerText?.declutterMode && layerText.declutterMode !== 'none') {
      return true;
    }

    // Check style-level text configs
    const layerStyle = layerConfig.getLayerStyle();
    if (layerStyle) {
      for (const geometryStyle of Object.values(layerStyle)) {
        for (const styleInfo of geometryStyle.info) {
          if (styleInfo.text?.declutterMode && styleInfo.text.declutterMode !== 'none') {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Method for getting the text style
   *
   * @param feature - The feature to get the text style for
   * @param resolution - The resolution of the map
   * @param styleSettings - The style settings
   * @param layerText - The layer text configuration
   * @param aliasLookup - The alias lookup
   * @returns The text style or undefined if no text style should be applied
   */
  static getTextStyle = (
    feature: FeatureLike,
    resolution: number,
    styleSettings: TypeLayerStyleSettings,
    layerText?: TypeLayerTextConfig,
    aliasLookup?: TypeAliasLookup
  ): Text | undefined => {
    const { type, info } = styleSettings;
    let symbolText: TypeLayerTextConfig | undefined;

    if (type === 'simple') {
      // For simple styles, use the first (and only) style info
      symbolText = info[0]?.text;
    }

    if (type === 'uniqueValue') {
      // Find the matching unique value entry
      const foundUniqueValueInfo = GeoviewRenderer.searchUniqueValueEntry(
        styleSettings.fields,
        info,
        feature as Feature,
        undefined, // domainsLookup
        aliasLookup
      );
      symbolText = foundUniqueValueInfo?.text;
    }

    if (type === 'classBreaks') {
      // Find the matching class break entry
      const foundClassBreakInfo = GeoviewRenderer.searchClassBreakEntry(styleSettings.fields[0], info, feature as Feature, aliasLookup);
      symbolText = foundClassBreakInfo?.text;
    }

    const textSettings = symbolText || layerText;
    if (!textSettings) return undefined;

    return GeoviewTextRenderer.createTextStyle(feature, textSettings);
  };

  /**
   * Method for creating Text Style
   *
   * @param feature - The feature to create the text style for
   * @param textSettings - The text style settings
   * @returns The text style or undefined if no text style should be applied
   */
  static createTextStyle = (feature: FeatureLike, textSettings: TypeLayerTextConfig): Text | undefined => {
    const {
      field,
      fontSize = 10,
      fontFamily = 'sans-serif',
      bold = false,
      italic = false,
      maxAngle,
      offsetX,
      offsetY,
      overflow,
      placement,
      repeat,
      scale,
      rotateWithView,
      keepUpright,
      rotation,
      text,
      textAlign,
      justify,
      textBaseline,
      fill,
      haloColor,
      haloWidth,
      backgroundFill,
      backgroundStrokeColor,
      backgroundStrokeWidth,
      padding,
      declutterMode = 'declutter',
      wrap,
      wrapCount = 16,
      wrapLines,
    } = textSettings;

    // Get text from feature field or use static text
    let textValue: string | string[] | undefined;
    if (field) {
      textValue = String(feature.get(field) || undefined);
    } else if (text) {
      if (Array.isArray(text)) {
        // Process rich text array - only process text elements: ['text value', 'bold 10px sans-serif', '\n', '', 'text value 2', 'italic 8px serif']
        textValue = text.map((item, index) => {
          if (index % 2 === 0 && typeof item === 'string') {
            return item.includes('{') ? GeoviewTextRenderer.processTextTemplate(item, feature) : item;
          }
          return item;
        });
      } else {
        textValue = text.includes('{') ? GeoviewTextRenderer.processTextTemplate(text, feature) : text;
      }
    }
    if (!textValue) return undefined;

    if (wrap && typeof textValue === 'string') {
      textValue = GeoviewTextRenderer.wrapText(textValue, wrapCount, wrapLines);
    }

    // Build font string
    let fontStyle = '';
    if (italic) fontStyle += 'italic ';
    if (bold) fontStyle += 'bold ';
    const font = `${fontStyle}${fontSize}px ${fontFamily}`;

    // Convert rotation from degrees to radians
    const rotationRadians = rotation ? (rotation * Math.PI) / 180 : undefined;

    // Convert maxAngle from degrees to radians
    const maxAngleRadians = maxAngle ? (maxAngle * Math.PI) / 180 : undefined;

    return new Text({
      text: textValue,
      font,
      maxAngle: maxAngleRadians,
      offsetX,
      offsetY,
      overflow,
      placement,
      repeat,
      scale,
      rotateWithView,
      keepUpright,
      rotation: rotationRadians,
      textAlign,
      justify,
      textBaseline,
      fill: fill ? new Fill({ color: fill }) : undefined,
      stroke: haloColor ? new Stroke({ color: haloColor, width: haloWidth || 1 }) : undefined,
      backgroundFill: backgroundFill ? new Fill({ color: backgroundFill }) : undefined,
      backgroundStroke: backgroundStrokeColor ? new Stroke({ color: backgroundStrokeColor, width: backgroundStrokeWidth || 1 }) : undefined,
      padding,
      declutterMode,
    });
  };

  /**
   * Wrap text to fit within specified constraints
   *
   * @param str - The text to wrap
   * @param width - The maximum width per line
   * @param maxLines - Maximum number of lines (optional, overrides width if needed)
   * @returns The wrapped text
   */

  static wrapText(str: string, width: number, maxLines?: number): string {
    if (!maxLines) {
      // Original behavior when no maxLines specified
      return GeoviewTextRenderer.wrapTextByWidth(str, width);
    }

    // Split text into words
    const words = str.split(/\s+/);
    if (words.length === 0) return str;

    // If we can fit everything in maxLines with normal wrapping, do that
    const normalWrap = GeoviewTextRenderer.wrapTextByWidth(str, width);
    const normalLines = normalWrap.split('\n');

    if (normalLines.length <= maxLines) {
      return normalWrap;
    }

    // Need to fit into fewer lines - calculate optimal width per line
    const totalChars = str.length;
    const targetWidth = Math.ceil(totalChars / maxLines);

    // Build lines with the calculated width
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= targetWidth || currentLine === '') {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;

        // If we've reached maxLines, truncate remaining text
        if (lines.length >= maxLines - 1) {
          // Add ellipsis if there are more words
          const remainingWords = words.slice(words.indexOf(word));
          if (remainingWords.length > 1) {
            currentLine = `${currentLine}...`;
          }
          break;
        }
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines.slice(0, maxLines).join('\n');
  }

  /**
   * Wrap text to a specified width using word boundaries
   *
   * @param str - The text to wrap
   * @param width - The maximum width of each line
   * @returns The wrapped text
   */
  static wrapTextByWidth(str: string, width: number): string {
    // No wrapping required
    if (str.length <= width) return str;

    const words = str.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= width) {
        currentLine = testLine;
      } else {
        // If current line has content, push it and start new line
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Single word longer than width - force break it
          currentLine = word;
        }
      }
    }

    // Add the last line if it has content
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  }

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
  static processTextTemplate(template: string, feature: FeatureLike): string {
    return template.replace(/\{(\w+)(?::([^}]+))?\}/g, (match, fieldName, format) => {
      const fieldValue = feature.get(fieldName.trim());
      if (fieldValue === undefined) return match;

      // If format is specified, try to format as date
      if (format) {
        try {
          // TODO: CHECK DATETIME - Here, it's assuming 2 things to check:
          // TO.DOCONT: (1) that when a 'format' is specified it's always a date format, okay?
          // TO.DOCONT: (2) the fieldValue, when it's a date, will always be a UTC date. Is this okay or should the function
          // TO.DOCONT: be made aware that the layer config might have defined another timezone for its data via serviceDateTimezone ?
          return DateMgt.formatDate(fieldValue, format);
        } catch (e) {
          // Fall back to string conversion if date parsing fails
          logger.logWarning(`There was an issue replacing the field, ${fieldName}, with a value:`, e);
        }
      }

      return String(fieldValue);
    });
  }
}

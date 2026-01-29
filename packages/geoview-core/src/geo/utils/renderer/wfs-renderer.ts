import { and, or, not, greaterThan, greaterThanOrEqualTo, lessThan, lessThanOrEqualTo, equalTo, between, like } from 'ol/format/filter';
import type Filter from 'ol/format/filter/Filter';
import { writeFilter } from 'ol/format/WFS';

import type {
  TypeStylesWMS,
  TypeUserStyleMark,
  TypeUserStyleExternalGraphic,
  TypeUserStyleGraphic,
  TypeUserStyleSymbolizer,
  TypeUserStyleRule,
  TypeUserStyleRuleFilter,
} from '@/api/types/layer-schema-types';
import type {
  GraphicFillWithPattern,
  GraphicStrokeWithPlacement,
  TypeFillStyle,
  TypeLayerStyleConfigInfo,
  TypeLayerStyleConfigType,
  TypeLayerStyleSettings,
  TypeLayerStyleValueCondition,
  TypeLineStringVectorConfig,
  TypePolygonVectorConfig,
  TypeStrokeSymbolConfig,
  TypeStyleGeometry,
} from '@/api/types/map-schema-types';
import { formatError, NotSupportedError } from '@/core/exceptions/core-exceptions';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { isNumeric } from '@/core/utils/utilities';

/**
 * Class used to interpret a WFS, via its WMS equivalent, and build a Geoview Renderer style.
 */
export abstract class WfsRenderer {
  /**
   * Builds a layer style settings object from a WMS Styled Layer Descriptor (SLD).
   * This method parses the given `styles` object, iterates through its `Rule` elements,
   * and constructs a standardized record mapping geometry types (`Point`, `LineString`, etc.)
   * to their corresponding layer style settings.
   * It supports both `PointSymbolizer` and `LineSymbolizer` elements, handling:
   * - Symbolizer type detection
   * - Unique value vs. simple style classification
   * - Extraction of filter property names for unique value fields
   * - Delegation to helper methods for building individual symbolizer configurations
   * If no valid symbolizer rules are found, the method returns `undefined`.
   * @param {TypeStylesWMS} styles - A WMS SLD styles object to parse.
   * @returns {Record<TypeStyleGeometry, TypeLayerStyleSettings>} A record mapping geometry types to their layer style settings.
   * @throws {NotSupportedError} If the symbolizer type in a rule is unsupported.
   * @static
   */
  static buildLayerStyleInfo(
    styles: TypeStylesWMS,
    geomTypeMetadata: TypeStyleGeometry | undefined
  ): Record<TypeStyleGeometry, TypeLayerStyleSettings> {
    // Read first feature type style
    const featureTypeStyleRaw = styles.StyledLayerDescriptor?.NamedLayer?.UserStyle?.['se:FeatureTypeStyle'];

    // If couldn't read
    if (!featureTypeStyleRaw) throw new NotSupportedError(`Invalid StyledLayerDescriptor (SLD). Check the 'GetStyles' response.`);

    const firstFeatureTypeStyle = Array.isArray(featureTypeStyleRaw) ? featureTypeStyleRaw[0] : featureTypeStyleRaw;

    // Read rules
    const rulesRaw = firstFeatureTypeStyle['se:Rule'];
    const rules = Array.isArray(rulesRaw) ? rulesRaw : [rulesRaw];

    // Default geometry type
    let geomType: TypeStyleGeometry = 'Point' as TypeStyleGeometry;

    const infos: TypeLayerStyleConfigInfo[] = [];
    const fields: string[] = [];
    let hasClassBreaks: boolean = false;
    rules.forEach((userRule) => {
      // Check the filter for the rule if any
      const label = userRule['se:Name'] || 'unnamed';

      // If any filters
      let filterInfo: FilterInfo | undefined;
      if (userRule['ogc:Filter']) {
        // Get filter information
        filterInfo = this.#readFilterFromRule(userRule['ogc:Filter']);
        hasClassBreaks = filterInfo.hasGreaterOrLessThan;

        // Compile the fields
        if (!fields.includes(filterInfo.propertyName)) fields.push(filterInfo.propertyName);
      }

      // Check if it's a PointSymbolizer
      let theSymbolizer: Partial<TypeLayerStyleConfigInfo> | undefined = undefined;
      let pointSymbolizer: Partial<TypeLayerStyleConfigInfo> | undefined = undefined;
      let lineSymbolizer: Partial<TypeLayerStyleConfigInfo> | undefined = undefined;
      let polygonSymbolizer: Partial<TypeLayerStyleConfigInfo> | undefined = undefined;
      if (userRule['se:PointSymbolizer']) {
        // Process point symbolizers
        pointSymbolizer = this.#buildLayerStyleInfoPointSymbolizer(userRule['se:PointSymbolizer']);
        theSymbolizer = pointSymbolizer;
      }

      if (userRule['se:LineSymbolizer']) {
        // Line geometry type
        geomType = 'LineString';

        // Process line symbolizers
        lineSymbolizer = this.#buildLayerStyleInfoLineSymbolizer(userRule['se:LineSymbolizer']);
        theSymbolizer = lineSymbolizer;
      }

      if (userRule['se:PolygonSymbolizer']) {
        // Polygon geometry type
        geomType = 'Polygon';

        // Process polygon symbolizers
        polygonSymbolizer = this.#buildLayerStyleInfoPolygonSymbolizer(userRule['se:PolygonSymbolizer']);
        theSymbolizer = polygonSymbolizer;
      }

      // If both a polygon and a line symbolizer for the same rule, combine
      if (polygonSymbolizer && lineSymbolizer) {
        // Combine
        const polygonSymbolSettings = polygonSymbolizer.settings as TypePolygonVectorConfig;
        const lineSymbolSettings = lineSymbolizer.settings as TypeLineStringVectorConfig;
        polygonSymbolSettings.color = lineSymbolSettings.stroke.color;
        polygonSymbolSettings.stroke = lineSymbolSettings.stroke;
        theSymbolizer = polygonSymbolizer;
      }

      // If the symbolizer is defined
      if (theSymbolizer) {
        // Set the label and values now completing the 'TypeLayerStyleConfigInfo'
        theSymbolizer.label = label;
        theSymbolizer.values = filterInfo?.values || [];
        theSymbolizer.valuesConditions = filterInfo?.valuesConditions;

        // Add it
        infos.push(theSymbolizer as TypeLayerStyleConfigInfo);
      }
    });

    // If no infos
    if (infos.length === 0) throw new NotSupportedError('Unsupported Layer styling for the WFS layer from the WMS styles metadata');

    // Read the type from the symbolizers
    const type = this.#readTypeFromSymbolizers(rules, hasClassBreaks, fields);

    // The settings
    const styleSettings = {
      type,
      fields,
      hasDefault: false,
      info: infos,
    } as unknown as TypeLayerStyleSettings;

    // Compile the style settings into the layer style for the geometry type
    const layerStyle: Partial<Record<TypeStyleGeometry, TypeLayerStyleSettings>> = {};
    layerStyle[geomType] = styleSettings;

    // Special case:
    // If processing a polygon geometry type and could only find a 'LineString', make it a 'Polygon' instead with transparent fill
    if ((geomTypeMetadata === 'Polygon' || geomTypeMetadata === 'MultiPolygon') && layerStyle['LineString'] && !layerStyle['Polygon']) {
      // Replace the LineString for a Polygon/MultiPolygon
      layerStyle[geomTypeMetadata] = WfsRenderer.#copyLineStyleForPolygon(styleSettings);
      delete layerStyle.LineString;
    }

    // Return the information
    return layerStyle as Record<TypeStyleGeometry, TypeLayerStyleSettings>;
  }

  /**
   * Parses a user style rule filter and extracts normalized filter information.
   * This method supports only simple numeric comparison filters typically found
   * in SLD/OGC style rules, such as:
   * - `PropertyIsEqualTo`
   * - `PropertyIsGreaterThan`
   * - `PropertyIsGreaterThanOrEqualTo`
   * - `PropertyIsLessThan`
   * - `PropertyIsLessThanOrEqualTo`
   * It also supports filters wrapped inside an `ogc:And` block.
   * Unsupported cases:
   * - Function-based filters (e.g., `ogc:Function` inside `PropertyIsEqualTo`)
   * - Complex logical filters that cannot be reduced to numeric comparisons
   * @param {TypeUserStyleRuleFilter} filter
   *   The raw OGC filter extracted from a UserStyle rule.
   * @returns {FilterInfo}
   *   A normalized structure describing the property name, comparison types,
   *   and associated threshold values.
   * @throws {NotSupportedError}
   *   If the filter uses `ogc:Function` or cannot be interpreted as a numeric
   *   comparison rule.
   * @private
   * @static
   */
  static #readFilterFromRule(filter: TypeUserStyleRuleFilter): FilterInfo {
    // If the filter is based on a function, throw error
    if (filter['ogc:PropertyIsEqualTo']?.['ogc:Function']) throw new NotSupportedError('Filters based on functions are not supported.');

    // Read simple filters
    let filterOption = this.#readFilterInfoNumberOptionFromFilter(filter);
    if (filterOption) {
      return filterOption;
    }

    // If using 'AND'
    if (filter?.['ogc:And']) {
      filterOption = this.#readFilterInfoNumberOptionFromFilter(filter?.['ogc:And']);
      if (filterOption) {
        return filterOption;
      }
    }

    // Throw
    throw new NotSupportedError(`Couldn't read the filter information.`);
  }

  /**
   * Attempts to read numeric comparison filter information from an OGC filter block.
   * This method interprets filters of the following forms:
   * - `ogc:PropertyIsEqualTo`
   * - `ogc:PropertyIsGreaterThan`
   * - `ogc:PropertyIsGreaterThanOrEqualTo`
   * - `ogc:PropertyIsLessThan`
   * - `ogc:PropertyIsLessThanOrEqualTo`
   * It returns a normalized `FilterInfo` object containing:
   * - `propertyName`: the attribute being compared
   * - `values`: an array holding either:
   *      - one value for equality filters, or
   *      - `[min, max]` for class-break-style numeric ranges
   * - `valuesConditions`: operators (`>=`, `>`, `<=`, `<`) corresponding to each value
   * - `hasGreaterOrLessThan`: whether the rule represents range-based comparisons
   * If no supported comparison operator is found, the method returns `undefined`.
   * @param {TypeUserStyleRuleFilter} filter
   *   The OGC filter block to evaluate.
   * @returns {FilterInfo | undefined}
   *   A normalized filter description, or `undefined` if the filter does not
   *   contain recognizable numeric comparison operators.
   * @private
   * @static
   */
  static #readFilterInfoNumberOptionFromFilter(filter: TypeUserStyleRuleFilter): FilterInfo | undefined {
    // Read equal to first
    let hasGreaterOrLessThan: boolean = false;
    let filterOption = filter?.['ogc:PropertyIsEqualTo'];
    let propertyName = filterOption?.['ogc:PropertyName'];
    let values: (number | string)[] = [filterOption?.['ogc:Literal']!];
    let minValueCondition: TypeLayerStyleValueCondition = '>=';
    let maxValueCondition: TypeLayerStyleValueCondition = '<=';
    let valuesConditions: TypeLayerStyleValueCondition[] | undefined = undefined;

    if (!filterOption) {
      let min: number = -99999999999;
      let max: number = 99999999999;

      filterOption = filter?.['ogc:PropertyIsGreaterThan'];
      if (filterOption) {
        // We are doing class breaks
        hasGreaterOrLessThan = true;
        minValueCondition = '>';
        propertyName = filterOption['ogc:PropertyName'];
        min = Number(filterOption?.['ogc:Literal']);
      }

      filterOption = filter?.['ogc:PropertyIsGreaterThanOrEqualTo'];
      if (filterOption) {
        // We are doing class breaks
        hasGreaterOrLessThan = true;
        minValueCondition = '>=';
        propertyName = filterOption?.['ogc:PropertyName'];
        min = Number(filterOption?.['ogc:Literal']);
      }

      filterOption = filter?.['ogc:PropertyIsLessThan'];
      if (filterOption) {
        // We are doing class breaks
        hasGreaterOrLessThan = true;
        maxValueCondition = '<';
        propertyName = filterOption?.['ogc:PropertyName'];
        max = Number(filterOption?.['ogc:Literal']);
      }

      filterOption = filter?.['ogc:PropertyIsLessThanOrEqualTo'];
      if (filterOption) {
        // We are doing class breaks
        hasGreaterOrLessThan = true;
        maxValueCondition = '<=';
        propertyName = filterOption?.['ogc:PropertyName'];
        max = Number(filterOption?.['ogc:Literal']);
      }

      values = [min, max];
      valuesConditions = [minValueCondition, maxValueCondition];
    }

    // If found
    if (propertyName) {
      return { hasGreaterOrLessThan, propertyName, values, valuesConditions };
    }

    // Not found
    return undefined;
  }

  /**
   * Determines the style configuration type (`'simple'` or `'uniqueValue'`) based on
   * the provided symbolizer rules and available attribute fields.
   * The method analyzes the list of SLD/SE rules to identify whether the style
   * contains multiple symbolizer-based rules (e.g., point, line, or polygon symbolizers),
   * which implies a unique-value rendering type. If only one such rule exists,
   * the style is treated as a simple renderer.
   * If multiple rules exist but no attribute fields are available to determine
   * filtering logic, a {@link NotSupportedError} is thrown.
   * @param {TypeUserStyleRule[]} rules - The list of user style rules from the SLD or SE definition.
   * @param {string[]} fields - The list of available attribute field names for filtering or symbolization.
   * @returns {TypeLayerStyleConfigType} The detected style configuration type, either `'simple'` or `'uniqueValue'`.
   * @throws {NotSupportedError} When a unique-value style is detected but no fields are available for filtering.
   */
  static #readTypeFromSymbolizers(rules: TypeUserStyleRule[], hasClassBreaks: boolean, fields: string[]): TypeLayerStyleConfigType {
    // Default type
    let type: TypeLayerStyleConfigType = 'simple';

    // Get the rules with any symbolizer except text
    const rulesWithGraphicSymbol = rules.filter(
      (rule) => rule['se:PointSymbolizer'] || rule['se:LineSymbolizer'] || rule['se:PolygonSymbolizer']
    );

    // If more than 1 rule with infos
    if (rulesWithGraphicSymbol.length > 1) type = 'uniqueValue';

    // If has class breaks
    if (hasClassBreaks) type = 'classBreaks';

    // If the style type is unique value but we couldn't find any fields to filter on
    if (type === 'uniqueValue' && fields.length === 0)
      throw new NotSupportedError(
        `The styles read from the service seem to support unique value rendering (different rules were read), but no fields could be determined to filter the data.`
      );

    // If the style type is unique value but we couldn't find any fields to filter on
    if (type === 'classBreaks' && fields.length === 0)
      throw new NotSupportedError(
        `The styles read from the service seem to support class breaks rendering (styling is done on range of numbers), but no fields could be determined to filter the data.`
      );

    // Return the type
    return type;
  }

  /**
   * Builds a complete style configuration object for a point symbolizer layer.
   * This method processes one or more SE/SLD `<se:PointSymbolizer>` definitions,
   * parses their graphical content, merges all SVG graphics into a single
   * base64-encoded SVG image, and constructs a standardized layer style configuration.
   * It supports both well-known marks and external SVG graphics and computes
   * the correct scaling, opacity, and positioning metadata for rendering
   * in a GeoView layer configuration.
   * @param {TypeUserStyleSymbolizer | TypeUserStyleSymbolizer[]} symbolizer -
   *   A single point symbolizer or an array of symbolizers defining the graphic appearance.
   * @returns {TypeLayerStyleConfigInfo | undefined} A complete layer style configuration
   *   object containing the merged SVG symbol, or `undefined` if no valid graphics were found.
   * @private
   * @static
   */
  static #buildLayerStyleInfoPointSymbolizer(
    symbolizer: TypeUserStyleSymbolizer | TypeUserStyleSymbolizer[]
  ): Partial<TypeLayerStyleConfigInfo> | undefined {
    const symbolizers = Array.isArray(symbolizer) ? symbolizer : [symbolizer];

    // For each symbolizer
    let globalMimeType: string | undefined;
    let globalSize = 1;
    let globalMaxViewBox = 0;
    let globalFromSVGsOrMarkers: 'svg' | 'marker' | undefined;
    const allGraphicsInfo: GraphicInfo[] = [];
    symbolizers.forEach((symbol) => {
      // Parse the graphics
      const {
        graphicsInfo,
        maxViewBox,
        sizeGraphic: symSize,
        mimeType: symMime,
        fromSVGsOrMarkers: fromGraphic,
      } = this.#parseGraphic(symbol['se:Graphic']);

      // If no graphics info gathered
      if (graphicsInfo.length === 0) return; // Skip

      globalMimeType ??= symMime;
      globalFromSVGsOrMarkers = globalFromSVGsOrMarkers !== 'svg' ? fromGraphic : 'svg';
      globalSize = Math.max(globalSize, symSize);
      globalMaxViewBox = Math.max(globalMaxViewBox, maxViewBox);
      allGraphicsInfo.push(...graphicsInfo);
    });

    // If no graphics info gathered at all
    if (allGraphicsInfo.length === 0) return undefined;

    // Merge the SVGs togeter
    const mergedSVG = this.#mergeSVGs(allGraphicsInfo, globalMaxViewBox, globalSize, globalFromSVGsOrMarkers!);

    // Log it, leaving the logDebug for dev purposes
    // logger.logDebug('FINAL SVG', mergedSVG);

    // SVG to Base64
    const base64SVG = GeoviewRenderer.SVGStringToBase64(mergedSVG);

    return {
      visible: true,
      settings: {
        mimeType: globalMimeType,
        offset: [0, 0],
        opacity: 1,
        rotation: 0,
        src: base64SVG,
        type: 'iconSymbol',
      },
    } as Partial<TypeLayerStyleConfigInfo>;
  }

  /**
   * Builds a complete style configuration object for a line symbolizer layer.
   * This method processes an SE/SLD `<se:LineSymbolizer>` definition, reads its stroke
   * parameters, and constructs a standardized layer style configuration object.
   * It supports stroke color, width, opacity, and dash array (line style) settings.
   * If no meaningful stroke information is found, it returns `undefined`.
   * @param {TypeUserStyleSymbolizer} symbolizer - The point symbolizer defining the line appearance.
   * @returns {TypeLayerStyleConfigInfo | undefined} A complete layer style configuration
   *   object containing the stroke settings, or `undefined` if the symbolizer has no valid stroke.
   * @private
   * @static
   */
  static #buildLayerStyleInfoLineSymbolizer(
    symbolizer: TypeUserStyleSymbolizer | TypeUserStyleSymbolizer[]
  ): Partial<TypeLayerStyleConfigInfo> | undefined {
    const symbolizers = Array.isArray(symbolizer) ? symbolizer : [symbolizer];

    // Accumulated stroke settings (first non-undefined wins per field)
    let strokeColor: string | undefined;
    let strokeWidth = 1;
    let strokeOpacity = 1;
    let strokeDashArray: number[] | undefined;
    let strokeLineJoin: string | undefined;
    let strokeLineCap: string | undefined;

    // Collect graphics with their placements
    const graphicStrokes: GraphicStrokeWithPlacement[] = [];

    for (const sym of symbolizers) {
      const stroke = sym['se:Stroke'];
      if (stroke) {
        // If GraphicStroke present, construct graphicStroke settings
        const graphicStrokeEl = stroke['se:GraphicStroke'];

        if (graphicStrokeEl) {
          const graphicNode =
            graphicStrokeEl['se:Graphic'] ?? (Array.isArray(graphicStrokeEl) ? graphicStrokeEl[0]?.['se:Graphic'] : undefined);

          if (graphicNode) {
            const settings = this.#buildGraphicStrokeFromGraphic(graphicNode);
            if (settings) {
              // Get rotation if present
              const rotation = Number(
                graphicNode?.['se:Rotation']?.['ogc:Literal']?.['#text'] ?? graphicNode?.['se:Rotation']?.['#text'] ?? 0
              );

              if (!Number.isNaN(rotation)) {
                settings.rotation = rotation;
              }

              // Get placement if any
              const placements = this.#extractPlacementsFromVendorOptions(sym);
              graphicStrokes.push({
                settings,
                placement: placements[0], // take first placement if multiple
              });
            }
          }

          // GraphicStroke may have stroke params
          const innerStroke = graphicNode?.['se:Stroke'] ?? stroke;
          const params = this.#extractStrokeParams(innerStroke);
          strokeColor ??= params.color;
          strokeWidth = params.width ?? strokeWidth;
          strokeOpacity = params.opacity ?? strokeOpacity;
          strokeDashArray ??= params.dasharray;
          strokeLineJoin ??= params.lineJoin;
          strokeLineCap ??= params.lineCap;
        } else {
          // Normal stroke: extract and merge
          const params = this.#extractStrokeParams(stroke);
          strokeColor ??= params.color;
          strokeWidth = params.width ?? strokeWidth;
          strokeOpacity = params.opacity ?? strokeOpacity;
          strokeDashArray ??= params.dasharray;
          strokeLineJoin ??= params.lineJoin;
          strokeLineCap ??= params.lineCap;
        }
      }
    }

    // If nothing meaningful found, return undefined
    if (!strokeColor && strokeWidth === 1 && strokeOpacity === 1 && !strokeDashArray && graphicStrokes.length === 0) {
      return undefined;
    }

    // Build the style config
    const strokeSettings = {
      color: strokeColor ?? '#000000',
      lineStyle: strokeDashArray && strokeDashArray.length > 0 ? 'dash' : 'solid',
      width: strokeWidth,
      opacity: strokeOpacity,
      dasharray: strokeDashArray,
      lineJoin: strokeLineJoin,
      lineCap: strokeLineCap,
    } as TypeStrokeSymbolConfig;

    const settings: TypeLineStringVectorConfig = {
      type: 'lineString',
      stroke: strokeSettings,
    };

    // GV Leaving the code commented here, as it can be useful for debug purposes until we
    // GV decide we don't need it anymore (there's a TODO in map-schema-types about it too)
    // // Add graphics with their placements if any
    // if (graphicStrokes.length > 0) {
    //   settings.graphicStrokes = graphicStrokes;
    // }

    return {
      visible: true,
      settings,
    } as Partial<TypeLayerStyleConfigInfo>;
  }

  /**
   * Builds a complete style configuration object for a polygon symbolizer layer.
   * This method processes an SE/SLD `<se:PolygonSymbolizer>` definition, reads its fill
   * and stroke parameters, and constructs a standardized layer style configuration object.
   * It supports fill color, opacity, stroke settings and pattern fills.
   * @param {TypeUserStyleSymbolizer} symbolizer - The polygon symbolizer defining the appearance.
   * @returns {TypeLayerStyleConfigInfo | undefined} A complete layer style configuration
   *   object containing the fill and stroke settings, or `undefined` if no valid style found.
   * @private
   * @static
   */
  static #buildLayerStyleInfoPolygonSymbolizer(
    symbolizer: TypeUserStyleSymbolizer | TypeUserStyleSymbolizer[]
  ): Partial<TypeLayerStyleConfigInfo> | undefined {
    const symbolizers = Array.isArray(symbolizer) ? symbolizer : [symbolizer];

    // Accumulated fill settings
    let fillColor: string | undefined;
    let fillOpacity = 1;
    let fillPattern: string | undefined;

    // Accumulated stroke settings
    let strokeColor: string | undefined;
    let strokeWidth = 1;
    let strokeOpacity = 1;
    let strokeDashArray: number[] | undefined;
    let strokeLineJoin: string | undefined;
    let strokeLineCap: string | undefined;

    // Graphic fill collection
    const graphicFills: GraphicFillWithPattern[] = [];

    for (const sym of symbolizers) {
      // Process Fill
      const fill = sym['se:Fill'];
      if (fill) {
        // Check for GraphicFill
        const graphicFillEl = fill['se:GraphicFill'];
        if (graphicFillEl) {
          const graphicNode =
            graphicFillEl['se:Graphic'] ??
            (Array.isArray(graphicFillEl) ? (graphicFillEl as TypeUserStyleSymbolizer[])[0]?.['se:Graphic'] : undefined);

          if (graphicNode) {
            const settings = this.#buildGraphicStrokeFromGraphic(graphicNode);
            if (settings) {
              // Get pattern if specified via vendor option
              let pattern = this.#extractFillPatternFromVendorOptions(sym) as TypeFillStyle;

              // If not pattern was determined
              if (!pattern) {
                // Read the well know name
                const wkn = graphicNode['se:Mark']['se:WellKnownName'];
                settings.patternSize = Number(graphicNode['se:Size']);
                settings.patternWidth = 1;

                // If the graphicNode had a circle well known text graphic, assume dot filling
                if (wkn === 'circle') {
                  pattern = 'dot';
                  settings.patternWidth = 4; // default: 4
                } else if (wkn === 'horline') {
                  pattern = 'horizontal';
                  settings.patternSize = 10; // default: 10
                  const rotation = Number(graphicNode['se:Rotation']['ogc:Literal']);
                  if (rotation === 45) pattern = 'forwardDiagonal';
                  else if (rotation === 135) pattern = 'backwardDiagonal';
                }
              }

              // Add to the graphic fills
              graphicFills.push({
                settings,
                pattern,
              });
            }
          }
        } else {
          // Regular fill parameters
          const fillParams = this.#extractFillParams(fill);
          fillColor ??= fillParams.color;
          fillOpacity = fillParams.opacity ?? fillOpacity;
          fillPattern ??= fillParams.pattern;
        }
      }

      // Process Stroke
      const stroke = sym['se:Stroke'];
      if (stroke) {
        const params = this.#extractStrokeParams(stroke);
        strokeColor ??= params.color;
        strokeWidth = params.width ?? strokeWidth;
        strokeOpacity = params.opacity ?? strokeOpacity;
        strokeDashArray ??= params.dasharray;
        strokeLineJoin ??= params.lineJoin;
        strokeLineCap ??= params.lineCap;
      }
    }

    // If nothing meaningful found, return undefined
    if (!fillColor && !strokeColor && fillOpacity === 1 && strokeOpacity === 1 && !strokeDashArray && graphicFills.length === 0) {
      return undefined;
    }

    // Build the style config
    const strokeSettings = {
      color: strokeColor ?? '#000000',
      lineStyle: strokeDashArray && strokeDashArray.length > 0 ? 'dash' : 'solid',
      width: strokeWidth,
      opacity: strokeOpacity,
      dasharray: strokeDashArray,
      lineJoin: strokeLineJoin,
      lineCap: strokeLineCap,
    } as TypeStrokeSymbolConfig;

    // Build the style config
    const settings: TypePolygonVectorConfig = {
      type: 'filledPolygon',
      fillStyle: 'solid',
      color: fillColor ?? 'transparent',
      opacity: fillOpacity,
      stroke: strokeSettings,
    };

    if (graphicFills.length > 0 && graphicFills[0].pattern) {
      settings.fillStyle = graphicFills[0].pattern as TypeFillStyle;
      settings.patternSize = graphicFills[0].settings.patternSize;
      settings.patternWidth = graphicFills[0].settings.patternWidth;
    }

    // Keeping this for debug purposes
    // // Add graphic fills if any
    // if (graphicFills.length > 0) {
    //   settings.graphicFills = graphicFills;
    // }

    return {
      visible: true,
      settings,
    } as Partial<TypeLayerStyleConfigInfo>;
  }

  /**
   * Creates a modified copy of a line style configuration to be used for polygon rendering.
   * This private static method deep-clones the provided line style settings and adjusts them
   * so that the resulting style represents a polygon with only an outline (no fill color).
   * It changes each style entry's `type` to `'filledPolygon'`, sets the `color` to `'transparent'`,
   * and uses a `'solid'` fill style to maintain the border.
   * @param {TypeLayerStyleSettings} styleSettings - The original line style configuration to clone and modify.
   * @returns {TypeLayerStyleSettings} A deep-cloned copy of the input style settings, adapted for polygon outlines.
   * @private
   * @static
   */
  static #copyLineStyleForPolygon(styleSettings: TypeLayerStyleSettings): TypeLayerStyleSettings {
    // Clone it
    const clonePolygonStyleSettings = structuredClone(styleSettings);

    // Tweak the style for a polygon with only a border
    clonePolygonStyleSettings.info = clonePolygonStyleSettings.info.map((styleInfo) => ({
      ...styleInfo,
      settings: {
        ...styleInfo.settings,
        type: 'filledPolygon',
        color: 'transparent',
        fillStyle: 'solid',
      },
    }));

    // Return it
    return clonePolygonStyleSettings;
  }

  /**
   * Extract stroke parameters from a <se:Stroke> node (SvgParameter/CssParameter)
   * and return a normalized object. Does not mutate existing values; caller may merge.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static #extractStrokeParams(strokeNode: any): {
    color?: string;
    width?: number;
    opacity?: number;
    dasharray?: number[] | undefined;
    lineJoin?: string | undefined;
    lineCap?: string | undefined;
  } {
    const out: {
      color?: string;
      width?: number;
      opacity?: number;
      dasharray?: number[] | undefined;
      lineJoin?: string | undefined;
      lineCap?: string | undefined;
    } = {};

    if (!strokeNode) return out;

    const svgParams = strokeNode['se:SvgParameter'] ?? strokeNode['se:CssParameter'] ?? [];
    const params = Array.isArray(svgParams) ? svgParams : [svgParams];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params.forEach((p: any) => {
      const name = p?.['@attributes']?.name ?? p?.name ?? p?.Name;
      const val = p?.['#text'] ?? p?.['#value'] ?? (typeof p === 'string' ? p : undefined);
      if (!name || val === undefined) return;
      const n = String(name).toLowerCase();
      const v = String(val).trim();

      if (n === 'stroke' || n === 'color') out.color ??= v;
      else if (n === 'stroke-width' || n === 'width') {
        const num = Number(v);
        if (!Number.isNaN(num)) out.width ??= num;
      } else if (n === 'stroke-opacity' || n === 'opacity') {
        const num = Number(v);
        if (!Number.isNaN(num)) out.opacity ??= Math.max(0, Math.min(1, num));
      } else if (n === 'stroke-dasharray' || n === 'dasharray') {
        const arr = v
          .split(/[\s,]+/)
          .map((s) => Number(s))
          .filter((n1) => !Number.isNaN(n1));
        if (arr.length) out.dasharray ??= arr;
      } else if (n === 'stroke-linejoin' || n === 'linejoin') out.lineJoin ??= v.toLowerCase();
      else if (n === 'stroke-linecap' || n === 'linecap') out.lineCap ??= v.toLowerCase();
    });

    return out;
  }

  /**
   * Extract fill parameters from a <se:Fill> node (SvgParameter/CssParameter)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static #extractFillParams(fillNode: any): {
    color?: string;
    opacity?: number;
    pattern?: string;
  } {
    const out: {
      color?: string;
      opacity?: number;
      pattern?: string;
    } = {};

    if (!fillNode) return out;

    const svgParams = fillNode['se:SvgParameter'] ?? fillNode['se:CssParameter'] ?? [];
    const params = Array.isArray(svgParams) ? svgParams : [svgParams];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params.forEach((p: any) => {
      const name = p?.['@attributes']?.name ?? p?.name ?? p?.Name;
      const val = p?.['#text'] ?? p?.['#value'] ?? (typeof p === 'string' ? p : undefined);
      if (!name || val === undefined) return;

      const n = String(name).toLowerCase();
      const v = String(val).trim();

      if (n === 'fill' || n === 'color') out.color ??= v;
      else if (n === 'fill-opacity' || n === 'opacity') {
        const num = Number(v);
        if (!Number.isNaN(num)) out.opacity ??= Math.max(0, Math.min(1, num));
      } else if (n === 'fill-pattern' || n === 'pattern') out.pattern ??= v.toLowerCase();
    });

    return out;
  }

  /**
   * Build a graphicStroke settings object from a <se:Graphic> node.
   * Delegates to the point symbolizer builder to reuse external/mark parsing.
   * Returns the internal settings object or undefined.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static #buildGraphicStrokeFromGraphic(graphicNode: any): any | undefined {
    if (!graphicNode) return undefined;

    // create a minimal point symbolizer wrapper matching expected input type
    const pointSymbolizerWrapper = { 'se:Graphic': graphicNode } as TypeUserStyleSymbolizer;

    // reuse point symbolizer builder (produces TypeLayerStyleConfigInfo)
    const pointInfo = this.#buildLayerStyleInfoPointSymbolizer(pointSymbolizerWrapper);
    return pointInfo?.settings;
  }

  /**
   * Extract placement vendor options from a symbolizer node.
   * Returns an array of unique placements found (lower-cased).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static #extractPlacementsFromVendorOptions(sym: any): string[] {
    const placements: string[] = [];
    const vendorOptions = sym?.['se:VendorOption'];
    if (!vendorOptions) return placements;

    const items = Array.isArray(vendorOptions) ? vendorOptions : [vendorOptions];
    for (const opt of items) {
      const name = opt?.['@attributes']?.name ?? opt?.name;
      if (String(name).toLowerCase() === 'placement') {
        const val = String(opt['#text'] ?? opt['#value'] ?? '')
          .trim()
          .toLowerCase();
        if (val && !placements.includes(val)) placements.push(val);
      }
    }
    return placements;
  }

  /**
   * Extract fill pattern from vendor options
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static #extractFillPatternFromVendorOptions(sym: any): string | undefined {
    const vendorOptions = sym?.['se:VendorOption'];
    if (!vendorOptions) return undefined;

    const items = Array.isArray(vendorOptions) ? vendorOptions : [vendorOptions];
    for (const opt of items) {
      const name = opt?.['@attributes']?.name ?? opt?.name;
      if (String(name).toLowerCase() === 'fill-pattern') {
        return String(opt['#text'] ?? opt['#value'] ?? '')
          .trim()
          .toLowerCase();
      }
    }
    return undefined;
  }

  /**
   * Parses a point symbolizer definition and extracts its graphical representation
   * as an `ExternalGraphicsInfo` object.
   * This method inspects the provided SE/SLD `<se:PointSymbolizer>` definition
   * to determine whether it contains an `<se:ExternalGraphic>` (embedded SVG image)
   * or an `<se:Mark>` (well-known geometric shape). It then delegates parsing to
   * the appropriate internal helper function for building the SVG representation.
   * @param {TypeUserStyleGraphic} graphic - A Styled Layer Descriptor (SLD) or
   *   Symbology Encoding (SE) point symbolizer describing the graphic to render.
   * @returns {ExternalGraphicsInfo} The parsed graphic information, including SVG markup,
   *   viewport dimensions, MIME type, and size metadata.
   * @throws {NotSupportedError} Thrown if the symbolizer contains an unsupported
   *   or unrecognized graphic type.
   * @private
   * @static
   */
  static #parseGraphic(graphic: TypeUserStyleGraphic | undefined): ExternalGraphicsInfo {
    // Get the graphic size right away
    const sizeGraphic = Number(graphic?.['se:Size'] ?? 12); // default: 12

    // Check if we have ExternalGraphics (SVGs)
    const externalGraphics = graphic?.['se:ExternalGraphic'] ?? [];
    if (externalGraphics.length > 0) {
      // Redirect building the SVGs
      return this.#parseGraphicsGatherSVGs(externalGraphics, sizeGraphic);
    }

    // Support se:Mark (well-known shapes)
    const marker = graphic?.['se:Mark'];
    if (marker) {
      // Redirect building the markers
      return this.#parseGraphicsMarkers(marker, sizeGraphic);
    }

    // Unsupported
    throw new NotSupportedError('Unsupported graphic type');
  }

  /**
   * Parses and extracts embedded SVG graphics from a list of SE/SLD external graphic definitions.
   * This method processes an array of `<se:ExternalGraphic>` objects, decoding their
   * Base64-encoded SVG content, stripping outer `<svg>` wrappers, and collecting
   * their viewport and viewBox information into a unified `ExternalGraphicsInfo` structure.
   * It automatically determines the maximum viewBox size across all graphics and
   * captures the MIME type from the first encountered graphic format.
   * @param {TypeUserStyleExternalGraphic[]} graphics - An array of SE/SLD external graphic
   *   objects containing Base64-encoded SVG data and associated metadata.
   * @param {number} sizeGraphic - The default target size (in pixels) used for viewBox fallback
   *   when dimensions are not defined in the SVG.
   * @returns {ExternalGraphicsInfo} An object containing all extracted graphic elements,
   *   their viewBox and size information, and the detected MIME type.
   * @private
   * @static
   */
  static #parseGraphicsGatherSVGs(graphics: TypeUserStyleExternalGraphic[], sizeGraphic: number): ExternalGraphicsInfo {
    let maxViewBox = 0;
    let mimeType: string | undefined;
    const graphicsInfo: GraphicInfo[] = [];

    graphics.forEach((graphic) => {
      mimeType ??= graphic['se:Format'];
      const imgSrc = graphic['se:OnlineResource']['@attributes']['xlink:href'];
      const imgSrcRaw = GeoviewRenderer.base64ToSVGString(imgSrc);

      // If invalid SVG content (still has dynamic functions)
      if (imgSrcRaw.includes('param(')) return; // Skip

      // Log it, leaving the logDebug for dev purposes
      // logger.logDebug('IMG RAW', imgSrcRaw);

      // Computes the viewbox of the SVG
      const [vx, vy, vw, vh] = this.#computeViewBoxFromSvg(imgSrcRaw);

      // Keep max value
      maxViewBox = Math.max(maxViewBox, vw, vh);

      // GV Leaving this code here, as it was an attempt to make better SVG attributes (there's still work to be done here to make things better if we have time)
      // GV until we decide it's enough, then we can clear it
      // // Reads the width/height if any
      // const widthAttr = Number(imgSrcRaw.match(/width=["']?([\d.]+)(px)?["']?/i)?.[1]);
      // const heightAttr = Number(imgSrcRaw.match(/height=["']?([\d.]+)(px)?["']?/i)?.[1]);
      // if (widthAttr && heightAttr) {
      //   sizeGraphic = Math.max(widthAttr, heightAttr);
      // }

      // Only keep the inner SVG as we might be rebuilding it
      const innerSVG = imgSrcRaw.replace(/<svg[^>]*>|<\/svg>/gi, '');

      // Log it, leaving the logDebug for dev purposes
      // logger.logDebug('INNER SVG', innerSVG);

      // Add it
      graphicsInfo.push({ innerSVG, vx, vy, vw, vh });
    });

    // Return the information
    return { graphicsInfo, maxViewBox, sizeGraphic, mimeType, fromSVGsOrMarkers: 'svg' };
  }

  /**
   * Computes the bounding box–based `viewBox` for a given SVG string.
   * This method parses the provided SVG markup, temporarily attaches it to
   * an off-screen DOM element, and uses the browser’s native `getBBox()` API
   * to measure the actual drawing extent of all SVG contents.
   * The result can be used directly as a `viewBox` value for re-rendering or
   * scaling the SVG proportionally.
   * @param {string} svgString - The raw SVG XML string to measure.
   * @returns {number[] | undefined} An array of four numbers `[x, y, width, height]`
   * representing the computed `viewBox`, or `undefined` if the bounding box
   * could not be calculated (for example, if the SVG is invalid or cannot be rendered).
   */
  static #computeViewBoxFromSvg(svgString: string): number[] {
    // Parse the SVG text into a DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.documentElement as unknown as SVGSVGElement;

    // Append to an off-screen container so getBBox() works
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.left = '-9999px';
    document.body.appendChild(temp);
    temp.appendChild(svgEl);

    try {
      const bbox = svgEl.getBBox(); // computes the bounding box of all content
      return [bbox.x, bbox.y, bbox.width, bbox.height];
    } catch (error: unknown) {
      // Error
      throw new GeoViewError('Error computing viewBox for svg __param__', [svgString], formatError(error));
    } finally {
      // clean up DOM node
      temp.remove();
    }
  }

  /**
   * Parses a user-defined or well-known marker description into an SVG graphic definition.
   * This method takes a Styled Layer Descriptor (SLD) or SE (Symbology Encoding)
   * `<se:Mark>` definition and converts it into an internal `ExternalGraphicsInfo`
   * representation, including an SVG string that visually represents the marker
   * (e.g., circle, square, triangle, star).
   * The resulting object includes calculated stroke, fill, and geometric properties,
   * suitable for rendering within a composed symbol or style preview.
   * @param {TypeUserStyleMark} marker - A WellKnownName string (e.g., `'circle'`) or an SE/SLD
   *   `<se:Mark>` object describing the graphic mark definition.
   * @param {number} sizeGraphic - The target size (in pixels) of the generated marker.
   * @returns {ExternalGraphicsInfo} An object containing the generated SVG markup (`innerSVG`),
   *   its viewport dimensions, MIME type, and scaling metadata for rendering.
   * @private
   * @static
   */
  static #parseGraphicsMarkers(marker: TypeUserStyleMark, sizeGraphic: number): ExternalGraphicsInfo {
    const graphicsInfo: GraphicInfo[] = [];

    const wellKnownName = marker['se:WellKnownName'] ?? 'circle';

    // Stroke params (inside mark or symbolizer.stroke)
    const strokeObj = marker['se:Stroke'];
    const strokeParams = this.#readXMLParam(strokeObj?.['se:SvgParameter'] ?? strokeObj?.['se:CssParameter']);

    // Fill params
    const fillParams = this.#readXMLParam(marker['se:Fill']?.['se:SvgParameter'] ?? marker['se:Fill']?.['se:CssParameter']);

    const stroke = strokeParams['stroke'] ?? strokeParams['colour'] ?? strokeParams['color'] ?? '#000';
    const strokeWidth = Number(strokeParams['stroke-width'] ?? strokeParams['width'] ?? 1);
    const strokeOpacity = strokeParams['stroke-opacity'] ? Number(strokeParams['stroke-opacity']) : undefined;
    const fill = fillParams['fill'] ?? fillParams['colour'] ?? fillParams['color'] ?? fillParams['se:fill'] ?? 'none';

    // Build a simple SVG for common well-known names
    const cx = sizeGraphic / 2;
    const cy = sizeGraphic / 2;
    const r = Math.max(1, sizeGraphic * 0.4);
    let shape = '';

    switch (wellKnownName.toLowerCase()) {
      case 'square':
      case 'rect':
      case 'rectangle':
        {
          const pad = sizeGraphic * 0.15;
          const side = sizeGraphic - pad * 2;
          shape = `<rect x="${pad}" y="${pad}" width="${side}" height="${side}" rx="${Math.max(0, side * 0.08)}" ry="${Math.max(
            0,
            side * 0.08
          )}" />`;
        }
        break;
      case 'triangle':
      case 'triangle-up':
        {
          const p1 = `${cx},${sizeGraphic * 0.15}`;
          const p2 = `${sizeGraphic * 0.85},${sizeGraphic * 0.85}`;
          const p3 = `${sizeGraphic * 0.15},${sizeGraphic * 0.85}`;
          shape = `<polygon points="${p1} ${p2} ${p3}" />`;
        }
        break;
      case 'star':
        {
          // simple 5-point star approximation
          const R = r;
          const r2 = R * 0.5;
          const pts = Array.from({ length: 5 }).map((_, i) => {
            const a = ((-90 + i * 72) * Math.PI) / 180;
            const x = cx + R * Math.cos(a);
            const y = cy + R * Math.sin(a);
            const a2 = ((-90 + i * 72 + 36) * Math.PI) / 180;
            const x2 = cx + r2 * Math.cos(a2);
            const y2 = cy + r2 * Math.sin(a2);
            return `${x},${y} ${x2},${y2}`;
          });
          // pts is sequence; join into single polygon by flattening coords
          const flat = pts.join(' ');
          shape = `<polygon points="${flat}" />`;
        }
        break;
      case 'circle':
      default:
        {
          const rFixed = Math.max(r, 2);
          shape = `<circle cx="${cx}" cy="${cy}" r="${rFixed}" vector-effect="non-scaling-stroke" shape-rendering="geometricPrecision" />`;
        }
        break;
    }

    // Build attributes string
    const attrs: string[] = [];
    if (fill && fill !== 'none') attrs.push(`fill="${fill}"`);
    else attrs.push(`fill="none"`);
    if (stroke) attrs.push(`stroke="${stroke}"`);
    if (!Number.isNaN(strokeWidth) && strokeWidth > 0) attrs.push(`stroke-width="${strokeWidth}"`);
    if (strokeOpacity !== undefined && !Number.isNaN(strokeOpacity)) attrs.push(`stroke-opacity="${strokeOpacity}"`);

    // Wrap shape with a group that has the attributes applied
    const innerSVG = `<g ${attrs.join(' ')}>${shape}</g>`;

    // For markers, set viewbox to sizeGraphic square
    const vx = 0;
    const vy = 0;
    const vw = sizeGraphic;
    const vh = sizeGraphic;
    const mimeType = 'image/svg+xml';
    const maxViewBox = Math.max(0, vw, vh);
    graphicsInfo.push({ innerSVG, vx, vy, vw, vh });

    // Return the information
    return { graphicsInfo, maxViewBox, sizeGraphic, mimeType, fromSVGsOrMarkers: 'marker' };
  }

  /**
   * Extracts name–value parameter pairs from an XML-like object or array of objects.
   * This method is designed to normalize XML nodes (as parsed JSON objects) into
   * a flat key–value map, using the `name` attribute or property as the key and
   * the node text or value as the map value.
   * @param {any} obj - A single XML node or an array of XML nodes, each possibly containing
   *   attributes (e.g., `@attributes.name`) and text content (`#text` or `#value`).
   * @returns {Record<string, string>} A map of lowercase parameter names to their trimmed string values.
   * @private
   * @static
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static #readXMLParam(obj: any): Record<string, string> {
    const output: Record<string, string> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let items: any[] = [];
    if (Array.isArray(obj)) {
      items = obj;
    } else if (obj) {
      items = [obj];
    }

    for (const node of items) {
      if (typeof node === 'string') {
        output[node.toLowerCase()] = node.trim();
      } else {
        const name = node['@attributes']?.name ?? node.name ?? node.Name;
        const value = node['#text'] ?? node['#value'];

        if (name && value !== undefined) {
          output[name.toLowerCase()] = value.trim();
        }
      }
    }

    return output;
  }

  /**
   * Merges multiple SVG fragments into a single combined SVG element.
   * If more than one graphic is provided, each SVG is scaled and translated
   * based on its viewport coordinates so that all graphics fit within a shared
   * outer viewBox. If only one SVG is provided, it is returned as-is.
   * @param {GraphicInfo[]} graphicsInfo - An array of graphic information objects, each containing
   *   the SVG markup (`innerSVG`) and its viewport dimensions (`vx`, `vy`, `vw`, `vh`).
   * @param {number} maxViewBox - The maximum width and height for the combined SVG viewBox.
   * @param {number} size - The target rendering size used to calculate scaling.
   * @returns {string} A formatted SVG string containing all merged graphics.
   * @private
   * @static
   */
  static #mergeSVGs(graphicsInfo: GraphicInfo[], maxViewBox: number, size: number, fromSVGsOrMarkers: 'svg' | 'marker'): string {
    if (!graphicsInfo.length) return '';

    // Create the viewBox attribute, dependent on how we've build the SVG (from svg or markers)
    let outerViewBox = `viewBox="${0} ${0} ${size} ${size}"`;

    // If from multiple svgs (compilation) the viewBox needs adjusting again and svgs recentered
    let svgs: string[] = [];
    if (graphicsInfo.length > 1) {
      const scale = size / maxViewBox;
      const half = size / 2;

      svgs = graphicsInfo.map(({ innerSVG, vx, vy, vw, vh }) => {
        // Center of original content
        const cx = vx + vw / 2;
        const cy = vy + vh / 2;
        // Translate so center aligns with output center, then scale
        const tx = half - cx * scale;
        const ty = half - cy * scale;
        return `<g transform="translate(${tx},${ty}) scale(${scale})">${innerSVG}</g>`;
      });
    } else {
      // Only 1 graphic, if svg created recenter it(?)
      if (fromSVGsOrMarkers === 'svg') {
        outerViewBox = `viewBox="${0} ${-size} ${size} ${size}"`;
      }
      svgs.push(graphicsInfo[0].innerSVG);
    }

    // Combine into one big svg
    const svgContent = `<svg ${outerViewBox} xmlns="http://www.w3.org/2000/svg" width="${maxViewBox}" height="${maxViewBox}" preserveAspectRatio="xMidYMid meet">${svgs.join('')}</svg>`;

    // Pretty print it and return
    return this.#prettyPrintSVG(svgContent, 2, true);
  }

  /**
   * Pretty-prints a raw SVG string into a human-readable,
   * indented XML format.
   * This method parses the provided SVG markup into a DOM tree,
   * then recursively serializes each node with consistent indentation,
   * returning a formatted string suitable for display or inspection.
   * @param {string} svg - The raw SVG string.
   * @param {number} [indent=2] - The number of spaces per indentation level (used only when `minify` is false).
   * @param {boolean} [minify=false] - If true, removes all unnecessary whitespace and line breaks.
   * @returns {string} The formatted (or minified) SVG string.
   * @private
   * @static
   */
  static #prettyPrintSVG(svg: string, indent: number = 2, minify: boolean = false): string {
    const parser = new DOMParser();
    const xml = parser.parseFromString(svg, 'image/svg+xml');

    function serialize(node: Node, depth = 0): string {
      if (minify) {
        // --- MINIFY MODE ---
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          const attrs = Array.from(el.attributes)
            .map((a) => `${a.name}="${a.value}"`)
            .join(' ');
          const openTag = attrs ? `<${el.tagName} ${attrs}>` : `<${el.tagName}>`;
          const children = Array.from(el.childNodes);

          if (children.length === 0) {
            return `${openTag}</${el.tagName}>`;
          }

          const inner = children.map((child) => serialize(child, depth + 1)).join('');
          return `${openTag}${inner}</${el.tagName}>`;
        }

        if (node.nodeType === Node.TEXT_NODE) {
          return node.nodeValue?.trim() ?? '';
        }

        return '';
      }

      // --- PRETTY MODE ---
      const pad = ' '.repeat(depth * indent);
      let out = '';

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const attrs = Array.from(el.attributes)
          .map((a) => `${a.name}="${a.value}"`)
          .join(' ');
        const openTag = attrs ? `<${el.tagName} ${attrs}>` : `<${el.tagName}>`;
        const children = Array.from(el.childNodes);

        if (children.length === 0) {
          return `${pad}${openTag}</${el.tagName}>\n`;
        }

        out += `${pad}${openTag}\n`;
        children.forEach((child) => (out += serialize(child, depth + 1)));
        out += `${pad}</${el.tagName}>\n`;
        return out;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const trimmed = node.nodeValue?.trim();
        if (trimmed) out += `${pad}${trimmed}\n`;
      }

      return out;
    }

    return serialize(xml.documentElement);
  }

  // #region FILTER TO OGC_FILTER

  /**
   * Converts a SQL-like filter string into an OpenLayers WFS-compatible OGC filter XML fragment.
   * This function handles:
   *  - Standard SQL-like expressions (>, >=, <, <=, =, IN, BETWEEN)
   *  - Boolean operators (AND, OR, NOT)
   *  - "Always false" queries such as `1=0` or `false`
   * If the filter string is an "always false" expression, it generates a minimal
   * OGC filter using the provided `fieldNameForNegativeQueries` to ensure a valid
   * WFS request that returns no features.
   * For normal filters, it:
   *  1. Parses the SQL string into an AST.
   *  2. Converts the AST into an OpenLayers filter object.
   *  3. Serializes the filter object into XML suitable for WFS requests.
   * Only the inner children of the `<Filter>` element are returned; you can wrap them
   * in `<ogc:Filter>` as needed for a full WFS request.
   * @param {string} filterStr - The SQL-like filter expression to convert.
   * @param {string} version - The WFS version to target (only '1.0.0', '1.1.0', '2.0.0' supported; defaults to '1.1.0').
   * @param {string} fieldNameForNegativeQueries - The field name to use in "always false" filters (cases of 1=0 and such).
   * @returns {string} An XML string representing the inner contents of an OGC `<Filter>` element.
   *                   This can be directly used inside a WFS GetFeature request's `<Filter>` element.
   * @static
   */
  static sqlToOlFilterXml(filterStr: string, version: string, fieldNameForNegativeQueries: string): string {
    // Trim the filter
    const filterStrTrimmed = filterStr.trim();

    // Parse the SQL-like filter expression
    const ast = this.#sqlToOlWfsFilterXmlParse(filterStrTrimmed);

    // Convert into filter object
    const olFilter = this.#astToOlFilter(ast, fieldNameForNegativeQueries);

    // Make sure the version we want is supported by OpenLayers which only support 1.0.0, 1.1.0 and 2.0.0, default to 1.1.0
    const sanitizedVersion = ['1.0.0', '1.1.0', '2.0.0'].includes(version) ? version : '1.1.0';

    // Create the filter in XML format
    const filterNode = writeFilter(olFilter, sanitizedVersion);

    // Only the children, we'll add the <Filter> node later
    const childrenXml = Array.from(filterNode.childNodes)
      .map((child) => new XMLSerializer().serializeToString(child))
      .join('');

    // Return it
    return childrenXml;
  }

  /**
   * Parse a simple SQL-like filter expression string into an internal AST
   * suitable for later conversion into OGC/OL WFS filters.
   * This parser supports the following constructs:
   * - Parentheses for grouping: `( ... )`
   * - Logical operators at top level: `AND`, `OR`, `NOT`
   * - Comparison operators: `=`, `<`, `>`, `<=`, `>=`
   * - `IN` lists: `field IN ('a', 'b', 'c')`
   * - `BETWEEN`: `field BETWEEN 'x' AND 'y'`
   * - String or numeric literals
   * Examples of valid input:
   * - `"status = 'active'"`
   * - `"id IN (1, 2, 3)"`
   * - `"(type = 'A' AND NOT (id = 3))"`
   * - `"date BETWEEN '2020-01-01' AND '2020-12-31'"`
   * - `"NOT flag = 'Y'"`
   * Behavior:
   * - Leading/trailing whitespace is trimmed.
   * - Outer parentheses are removed when they fully wrap the expression.
   * - The function recursively parses nested expressions.
   * - Throws an error if the string cannot be parsed into a valid AST node.
   * @param {string} sqlString - A SQL-like filter expression to parse.
   * @returns {AST} An abstract syntax tree describing the logical and
   * comparison structure of the filter expression.
   * @throws {Error} If the filter expression cannot be parsed.
   * @private
   * @static
   */
  static #sqlToOlWfsFilterXmlParse(sqlString: string): AST {
    // eslint-disable-next-line no-param-reassign
    sqlString = sqlString.trim();

    // Remove outer parentheses
    if (sqlString.startsWith('(') && sqlString.endsWith(')')) {
      // Only unwrap if matching parentheses
      let depth = 0;
      let match = true;
      for (let i = 0; i < sqlString.length; i++) {
        if (sqlString[i] === '(') depth++;
        else if (sqlString[i] === ')') depth--;
        if (depth === 0 && i < sqlString.length - 1) {
          match = false;
          break;
        }
      }
      if (match) {
        return this.#sqlToOlWfsFilterXmlParse(sqlString.substring(1, sqlString.length - 1));
      }
    }

    // NOT operator
    // Look for "NOT " at top level
    const low = sqlString.toLowerCase();
    if (low.startsWith('not ')) {
      return { type: 'not', inner: this.#sqlToOlWfsFilterXmlParse(sqlString.substring(4)) };
    }

    // AND / OR at top level
    let depth = 0;
    for (let i = 0; i < sqlString.length; i++) {
      const c = sqlString[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if (depth === 0) {
        const rest = low.substring(i);
        if (rest.startsWith(' and ')) {
          return {
            type: 'and',
            left: this.#sqlToOlWfsFilterXmlParse(sqlString.substring(0, i)),
            right: this.#sqlToOlWfsFilterXmlParse(sqlString.substring(i + 5)),
          };
        } else if (rest.startsWith(' or ')) {
          return {
            type: 'or',
            left: this.#sqlToOlWfsFilterXmlParse(sqlString.substring(0, i)),
            right: this.#sqlToOlWfsFilterXmlParse(sqlString.substring(i + 4)),
          };
        }
      }
    }

    // IN operator
    const inMatch = sqlString.match(/^\s*("?)([A-Za-z0-9_.]+)\1\s+in\s*\((.+)\)\s*$/i);
    if (inMatch) {
      const prop = inMatch[2];
      const valuesPart = inMatch[3];
      const vals = valuesPart
        .split(',')
        .map((v) => v.trim())
        .map((v) => {
          // remove single (or double) quotes around each literal
          if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
            return v.substring(1, v.length - 1);
          }
          return v;
        });
      return { type: 'in', property: prop, values: vals };
    }

    // LIKE operator
    const likeRegex = /^\s*("?)([A-Za-z0-9_.]+)\1\s+like\s+'([^']+)'\s*$/i;
    const mLike = sqlString.match(likeRegex);
    if (mLike) {
      return {
        type: 'like',
        property: mLike[2],
        pattern: mLike[3], // e.g. "%a%"
      };
    }

    // BETWEEN
    const numberPattern = '[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][-+]?\\d+)?';
    const betweenRegex = new RegExp(
      `^\\s*("?)([A-Za-z0-9_.]+)\\1\\s+between\\s+` +
        `(?:'([^']+)'|(${numberPattern}))\\s+and\\s+` +
        `(?:'([^']+)'|(${numberPattern}))\\s*$`,
      'i'
    );
    const mBetween = sqlString.match(betweenRegex);
    if (mBetween) {
      const lit1 = mBetween[3] ?? mBetween[4];
      const lit2 = mBetween[5] ?? mBetween[6];

      return {
        type: 'cmp',
        op: 'between',
        property: mBetween[2],
        literal1: isNumeric(lit1) ? Number(lit1) : lit1,
        literal2: isNumeric(lit2) ? Number(lit2) : lit2,
      };
    }

    // Comparisons (>, <, =, etc.)
    const cmpRegex = /^\s*("?)([A-Za-z0-9_.]+)\1\s*(<=|>=|<|>|=)\s*(?:'(.*?)'|([0-9]+(?:\.[0-9]+)?))\s*$/;
    const m = sqlString.match(cmpRegex);
    if (!m) {
      throw new Error('Cannot parse filter: ' + sqlString);
    }

    const value = m[4] ?? m[5];
    return {
      type: 'cmp',
      property: m[2],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      op: m[3] as any,
      literal1: m[5] ? Number(value) : value,
    };
  }

  /**
   * Convert an internal SQL-AST node into an OpenLayers WFS filter object.
   * This method takes the AST produced by `#sqlToOlWfsFilterXmlParse` and
   * recursively builds the corresponding OpenLayers filter instances from
   * `ol/format/filter`. The resulting filter can be passed to
   * `ol/format/WFS` or `ol/format/Filter` serialization functions
   * (e.g., `writeFilter()`).
   * Supported AST node types:
   * • **cmp** — Comparison operators:
   *    - `>`  → `greaterThan()`
   *    - `>=` → `greaterThanOrEqualTo()`
   *    - `<`  → `lessThan()`
   *    - `<=` → `lessThanOrEqualTo()`
   *    - `=`  → `equalTo()`
   *    - `between` → `between()`, requires both `literal1` and `literal2`
   * • **in** — SQL `IN` list:
   *    Produces an OR of multiple `equalTo()` filters:
   *    `property IN (a, b, c)` → `or(equalTo(a), equalTo(b), equalTo(c))`
   * • **like** — SQL `LIKE` list:
   *    Produces a LIKE operation for strings:
   *    `property IN (a, b, c)` → `or(equalTo(a), equalTo(b), equalTo(c))`
   * • **and** — Logical AND:
   *    Recursively maps children to `and(left, right)`
   * • **or** — Logical OR:
   *    Recursively maps children to `or(left, right)`
   * • **not** — Logical NOT:
   *    Recursively maps child to `not(inner)`
   * The function throws if:
   *  • An unsupported comparison operator is encountered
   *  • A BETWEEN clause is missing its second literal
   *  • An unrecognized AST node type is provided
   * @param {AST} node - The AST node describing a comparison, logical operator, or IN/BETWEEN expression.
   * @returns {Filter} An OpenLayers filter object from `ol/format/filter/*`,
   *   suitable for WFS GetFeature serialization.
   * @throws {Error} If the AST node type or operator is unsupported.
   * @private
   * @static
   */
  static #astToOlFilter(node: AST, fieldNameForNegativeQueries: string): Filter {
    switch (node.type) {
      case 'cmp': {
        const { property, op, literal1, literal2 } = node;

        // GV Special case when we send 1=0 it means we want a 'no match'
        if (property === '1' && op === '=' && literal1 === 0) {
          // Always false
          return equalTo(fieldNameForNegativeQueries, '__NO__MATCH__');
        }

        switch (op) {
          case '>':
            return greaterThan(property, Number(literal1));
          case '>=':
            return greaterThanOrEqualTo(property, Number(literal1));
          case '<':
            return lessThan(property, Number(literal1));
          case '<=':
            return lessThanOrEqualTo(property, Number(literal1));
          case '=':
            return equalTo(property, literal1);
          case 'between':
            if (literal2 === undefined) {
              throw new Error('Between requires two literals');
            }
            return between(property, Number(literal1), Number(literal2));
        }
        throw new Error('Unsupported comparison op ' + op);
      }
      case 'in': {
        const { property, values } = node;
        const equals = values.map((v) => {
          const val = isNumeric(v) ? Number(v) : v;
          return equalTo(property, val);
        });

        // OGC Or requires at least 2 operands
        if (equals.length === 1) {
          return equals[0];
        }

        // More than 1 operand, use the 'or' indeed
        return or(...equals);
      }
      case 'like': {
        const { property, pattern } = node;
        const ogcPattern = pattern.replace(/%/g, '*').replace(/_/g, '?');
        return like(property, ogcPattern, '*', '?', '\\', false);
      }
      case 'and': {
        const left = this.#astToOlFilter(node.left, fieldNameForNegativeQueries);
        const right = this.#astToOlFilter(node.right, fieldNameForNegativeQueries);
        return and(left, right);
      }
      case 'or': {
        const left = this.#astToOlFilter(node.left, fieldNameForNegativeQueries);
        const right = this.#astToOlFilter(node.right, fieldNameForNegativeQueries);
        return or(left, right);
      }
      case 'not': {
        const inner = this.#astToOlFilter(node.inner, fieldNameForNegativeQueries);
        return not(inner);
      }
      default:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error('Unsupported AST node: ' + (node as any).type);
    }
  }

  /**
   * Combine a spatial GML filter and an attribute GML filter
   * into a single OGC <Filter> with <And>.
   * @param {string | undefined} spatialFilter - XML string for spatial filter, e.g. <ogc:Intersects>...</ogc:Intersects>
   * @param {string | undefined} attributeFilter - XML string for attribute filter, e.g. <ogc:Or>...</ogc:Or>
   * @returns {string | undefined} Combined XML <ogc:Filter> or undefined if nothing to combine
   */
  static combineGmlFilters(spatialFilter?: string, attributeFilter?: string): string | undefined {
    // If neither filter is defined, nothing to do
    if (!spatialFilter && !attributeFilter) {
      return undefined;
    }

    // If only one is present, wrap in <ogc:Filter>
    if (spatialFilter && !attributeFilter) {
      return spatialFilter;
    }

    if (!spatialFilter && attributeFilter) {
      return attributeFilter;
    }

    // Combine both under <And>
    return `
      <ogc:And>
        ${attributeFilter}
        ${spatialFilter}
      </ogc:And>
  `.trim();
  }

  /**
   * Wraps the ogc/fes filter with the appropriate XML node, based on if the service is WMS or WFS and the version of the service.
   *
   * WMS
   * └── FE 1.1
   *     └── ogc:Filter only
   * WFS ≤ 1.1
   * └── FE 1.1
   *     └── ogc:Filter
   * WFS 2.0
   * └── FES 2.0
   *     └── fes:Filter
   * @param ogcFilterToWrap
   * @param wmsOrWfs
   * @param version
   * @returns
   */
  static wrapOGCFilter(ogcFilterToWrap: string | undefined, wmsOrWfs: 'wms' | 'wfs', version: string): string | undefined {
    // If nothing to wrap
    if (!ogcFilterToWrap) return undefined;

    // WMS only supports ogc:Filter
    if (wmsOrWfs === 'wms') {
      return `
        <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml">
          ${ogcFilterToWrap}
        </ogc:Filter>
        `.trim();
    }

    // If the version is 1.3.0 or 2.0.0, use FES 2.0 filter
    switch (version) {
      case '2.0.0':
        return `
        <fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:gml="http://www.opengis.net/gml">
          ${ogcFilterToWrap}
        </fes:Filter>
        `.trim();
      default:
        return `
        <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml">
          ${ogcFilterToWrap}
        </ogc:Filter>
        `.trim();
    }
  }

  // #endregion
}

type ExternalGraphicsInfo = {
  graphicsInfo: GraphicInfo[];
  maxViewBox: number;
  sizeGraphic: number;
  mimeType?: string;
  fromSVGsOrMarkers: 'svg' | 'marker';
};

type GraphicInfo = { innerSVG: string; vx: number; vy: number; vw: number; vh: number };

type FilterInfo = {
  hasGreaterOrLessThan: boolean;
  propertyName: string;
  values: (number | string)[];
  valuesConditions?: TypeLayerStyleValueCondition[];
};

type AST = ComparisonNode | LogicalNode | NotNode | InNode | LikeNode;

interface ComparisonNode {
  type: 'cmp';
  property: string;
  op: '>' | '>=' | '<' | '<=' | '=' | 'between';
  literal1: string | number;
  literal2?: string | number;
}

interface LikeNode {
  type: 'like';
  property: string;
  pattern: string;
}

interface LogicalNode {
  type: 'and' | 'or';
  left: AST;
  right: AST;
}

interface NotNode {
  type: 'not';
  inner: AST;
}

interface InNode {
  type: 'in';
  property: string;
  values: string[];
}

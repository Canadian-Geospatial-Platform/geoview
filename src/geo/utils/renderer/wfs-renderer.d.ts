import type { TypeStylesWMS } from '@/api/types/layer-schema-types';
import type { TypeLayerStyleSettings, TypeStyleGeometry } from '@/api/types/map-schema-types';
/**
 * Class used to interpret a WFS, via its WMS equivalent, and build a Geoview Renderer style.
 */
export declare abstract class WfsRenderer {
    #private;
    /**
     * Builds a layer style settings object from a WMS Styled Layer Descriptor (SLD).
     *
     * This method parses the given `styles` object, iterates through its `Rule` elements,
     * and constructs a standardized record mapping geometry types (`Point`, `LineString`, etc.)
     * to their corresponding layer style settings.
     * It supports both `PointSymbolizer` and `LineSymbolizer` elements, handling:
     * - Symbolizer type detection
     * - Unique value vs. simple style classification
     * - Extraction of filter property names for unique value fields
     * - Delegation to helper methods for building individual symbolizer configurations
     * If no valid symbolizer rules are found, the method returns `undefined`.
     *
     * @param styles - A WMS SLD styles object to parse
     * @param geomTypeMetadata - Optional geometry type from metadata
     * @returns A record mapping geometry types to their layer style settings
     * @throws {NotSupportedError} When the symbolizer type in a rule is unsupported
     */
    static buildLayerStyleInfo(styles: TypeStylesWMS, geomTypeMetadata: TypeStyleGeometry | undefined): Record<TypeStyleGeometry, TypeLayerStyleSettings>;
    /**
     * Converts a SQL-like filter string into an OpenLayers WFS-compatible OGC filter XML fragment.
     *
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
     *
     * @param filterStr - The SQL-like filter expression to convert
     * @param version - The WFS version to target (only '1.0.0', '1.1.0', '2.0.0' supported; defaults to '1.1.0')
     * @param fieldNameForNegativeQueries - The field name to use in "always false" filters (cases of 1=0 and such)
     * @returns An XML string representing the inner contents of an OGC `<Filter>` element.
     *   This can be directly used inside a WFS GetFeature request's `<Filter>` element
     */
    static sqlToOlFilterXml(filterStr: string, version: string, fieldNameForNegativeQueries: string): string;
    /**
     * Combines a spatial GML filter and an attribute GML filter into a single OGC filter with `<And>`.
     *
     * @param spatialFilter - Optional XML string for spatial filter, e.g. `<ogc:Intersects>...</ogc:Intersects>`
     * @param attributeFilter - Optional XML string for attribute filter, e.g. `<ogc:Or>...</ogc:Or>`
     * @returns Combined XML `<ogc:Filter>` or undefined if nothing to combine
     */
    static combineGmlFilters(spatialFilter?: string, attributeFilter?: string): string | undefined;
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
     *
     * @param ogcFilterToWrap - The OGC filter XML string to wrap, or undefined
     * @param wmsOrWfs - Whether the service is WMS or WFS
     * @param version - The service version
     * @returns The wrapped filter XML string, or undefined if nothing to wrap
     */
    static wrapOGCFilter(ogcFilterToWrap: string | undefined, wmsOrWfs: 'wms' | 'wfs', version: string): string | undefined;
}
//# sourceMappingURL=wfs-renderer.d.ts.map
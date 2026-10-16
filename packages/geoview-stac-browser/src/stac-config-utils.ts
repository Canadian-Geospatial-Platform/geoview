import type {
  StacCollection,
  StacCollectionsConfig,
  StacCql2Expression,
  StacFootprintStyleConfig,
  StacItemDisplayOptions,
  StacPropertyFilterConfig,
  StacQueryableField,
} from './stac-browser-types';
import { COLLECTION_COLOR, COLLECTION_FILL_OPACITY, ITEM_COLOR, ITEM_FILL_OPACITY, SEARCH_FILL_OPACITY } from './stac-browser-style';

/** Context in which a footprint is drawn, which selects its configured style and defaults. */
export type StacFootprintKind = 'collection' | 'item' | 'search';

/**
 * Utility functions that apply the STAC browser package configuration.
 *
 * They resolve per-collection overrides over the package-level settings, pick footprint styles,
 * apply the collection include/exclude restriction, and turn the property-filter form into CQL2 JSON.
 * They are pure functions of the configuration and server metadata: no requests, no map access, no React state.
 */
export abstract class StacConfigUtils {
  // #region STATIC METHODS

  /**
   * Resolves collection-specific item presentation options over the package-level settings.
   *
   * @param display - Package-level display settings
   * @param collectionId - Optional item collection id
   * @returns A new set of effective display settings
   */
  static resolveItemDisplayOptions(display: StacItemDisplayOptions, collectionId?: string): StacItemDisplayOptions {
    const override = collectionId ? display.collectionOverrides?.[collectionId] : undefined;
    if (!override) return display;

    return {
      ...display,
      itemView: { ...display.itemView, ...override.itemView },
      preview: { ...display.preview, ...override.preview },
      actions: { ...display.actions, ...override.actions },
      footprintStyles: {
        collection: { ...display.footprintStyles?.collection, ...override.footprintStyles?.collection },
        search: { ...display.footprintStyles?.search, ...(override.footprintStyles?.search ?? override.footprintStyles?.collection) },
      },
    };
  }

  /**
   * Resolves the footprint style of a collection or item, with its defaults applied.
   *
   * - "collection": the collection extent, package collection style overridden by the collection style.
   * - "item": item footprints while browsing or viewing an item, styled by the collection override only.
   * - "search": search results, package search style overridden by the collection search (or collection) style.
   *
   * @param display - Display settings holding the package styles and collection overrides
   * @param collectionId - Optional collection id of the footprint
   * @param kind - The context in which the footprint is drawn
   * @returns The footprint color and fill opacity
   */
  static getFootprintStyle(
    display: Pick<StacItemDisplayOptions, 'footprintStyles' | 'collectionOverrides'>,
    collectionId: string | undefined,
    kind: StacFootprintKind
  ): Required<StacFootprintStyleConfig> {
    const override = collectionId ? display.collectionOverrides?.[collectionId]?.footprintStyles : undefined;

    let style: StacFootprintStyleConfig;
    let defaults: Required<StacFootprintStyleConfig>;
    if (kind === 'collection') {
      style = { ...display.footprintStyles?.collection, ...override?.collection };
      defaults = { color: COLLECTION_COLOR, fillOpacity: COLLECTION_FILL_OPACITY };
    } else if (kind === 'item') {
      style = { ...override?.collection };
      defaults = { color: ITEM_COLOR, fillOpacity: ITEM_FILL_OPACITY };
    } else {
      style = { ...display.footprintStyles?.search, ...(override?.search ?? override?.collection) };
      defaults = { color: ITEM_COLOR, fillOpacity: SEARCH_FILL_OPACITY };
    }

    return { color: style.color ?? defaults.color, fillOpacity: style.fillOpacity ?? defaults.fillOpacity };
  }

  /**
   * Applies the configured include/exclude restrictions to a list of collections.
   *
   * @param collections - All collections returned by the server
   * @param config - Optional collections configuration
   * @returns The allowed collections
   */
  static filterCollections(collections: StacCollection[], config?: StacCollectionsConfig): StacCollection[] {
    const include = config?.include?.length ? new Set(config.include) : undefined;
    const exclude = new Set(config?.exclude ?? []);
    return collections.filter((collection) => (!include || include.has(collection.id)) && !exclude.has(collection.id));
  }

  /**
   * Chooses queryable fields in the configured property-filter order, or server order when all fields are enabled.
   *
   * @param queryables - Server queryable definitions
   * @param config - Optional filter configuration
   * @returns Queryable field names and definitions in display order
   */
  static getPropertyFilterFields(
    queryables: Record<string, StacQueryableField>,
    config?: boolean | (string | StacPropertyFilterConfig)[]
  ): [string, StacQueryableField][] {
    if (config === false || config === undefined) return [];

    const configuredFields = Array.isArray(config)
      ? new Map(config.map((entry) => [typeof entry === 'string' ? entry : entry.field, entry]))
      : undefined;
    const fields = configuredFields ? Array.from(configuredFields.keys()) : Object.keys(queryables);
    return fields.flatMap((field): [string, StacQueryableField][] => {
      const queryable = queryables[field];
      if (!queryable || queryable.type === 'geometry' || queryable.format === 'geometry-any' || queryable.format === 'geometry') return [];

      const configured = configuredFields?.get(field);
      return [
        [field, configured && typeof configured !== 'string' && configured.label ? { ...queryable, title: configured.label } : queryable],
      ];
    });
  }

  /**
   * Builds a CQL2 JSON expression from non-empty property filter controls.
   *
   * @param filters - Property filter controls keyed by queryable field
   * @param queryables - Server queryable definitions used to convert input values
   * @returns A CQL2 JSON predicate, or undefined when no property filters are active
   */
  static buildCql2Filter(
    filters: Record<string, { operator?: string; value: string }>,
    queryables: Record<string, StacQueryableField>
  ): StacCql2Expression | undefined {
    const predicates: StacCql2Expression[] = [];

    Object.entries(filters).forEach(([field, control]) => {
      const queryable = queryables[field];
      if (!queryable || control.value.trim() === '') return;

      const { value: controlValue } = control;
      const { format, type } = queryable;
      let value: string | number | boolean = controlValue;
      if (type === 'integer' || type === 'number') {
        value = Number(controlValue);
        if (!Number.isFinite(value)) return;
      } else if (type === 'boolean') {
        if (controlValue !== 'true' && controlValue !== 'false') return;
        value = controlValue === 'true';
      } else if ((format === 'date' || format === 'date-time') && /^\d{4}-\d{2}-\d{2}$/.test(controlValue)) {
        value = `${controlValue}T00:00:00Z`;
      }

      predicates.push({ op: control.operator || '=', args: [{ property: field }, value] });
    });

    if (predicates.length === 0) return undefined;
    return predicates.length === 1 ? predicates[0] : { op: 'and', args: predicates };
  }

  // #endregion STATIC METHODS
}

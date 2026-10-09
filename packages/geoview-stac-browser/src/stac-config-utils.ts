import type { StacCql2Expression, StacItemDisplayOptions, StacPropertyFilterConfig, StacQueryableField } from './stac-browser-types';

/**
 * Resolves collection-specific item presentation options over the package-level settings.
 *
 * @param display - Package-level display settings
 * @param collectionId - Optional item collection id
 * @returns A new set of effective display settings
 */
export function resolveStacItemDisplayOptions(display: StacItemDisplayOptions, collectionId?: string): StacItemDisplayOptions {
  const override = collectionId ? display.collectionOverrides?.[collectionId] : undefined;
  if (!override) return display;

  return {
    ...display,
    itemView: { ...display.itemView, ...override.itemView },
    preview: { ...display.preview, ...override.preview },
    actions: { ...display.actions, ...override.actions },
    footprintStyles: {
      collection: { ...display.footprintStyles?.collection, ...override.footprintStyles?.collection },
      search: { ...display.footprintStyles?.search, ...override.footprintStyles?.search },
    },
  };
}

/**
 * Chooses queryable fields allowed by the configured property-filter list.
 *
 * @param queryables - Server queryable definitions
 * @param config - Optional filter configuration
 * @returns Queryable field names and definitions allowed in the UI
 */
export function getStacPropertyFilterFields(
  queryables: Record<string, StacQueryableField>,
  config?: boolean | (string | StacPropertyFilterConfig)[]
): [string, StacQueryableField][] {
  if (config === false || config === undefined) return [];

  const configuredFields = Array.isArray(config)
    ? new Map(config.map((entry) => [typeof entry === 'string' ? entry : entry.field, entry]))
    : undefined;
  return Object.entries(queryables)
    .filter(([field, queryable]) => {
      const isScalar = queryable.type !== 'geometry' && queryable.format !== 'geometry-any' && queryable.format !== 'geometry';
      return isScalar && (configuredFields === undefined || configuredFields.has(field));
    })
    .map(([field, queryable]) => {
      const configured = configuredFields?.get(field);
      return [
        field,
        configured && typeof configured !== 'string' && configured.label ? { ...queryable, title: configured.label } : queryable,
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
export function buildStacCql2Filter(
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

import type { StacFieldConfig, StacFieldFormat, StacItem, StacItemViewConfig } from './stac-browser-types';

/** A label/value row of the metadata view. */
export interface StacMetadataRow {
  /** The field path, used as a React key. */
  field: string;
  /** The label, translated by the caller when configured. */
  label: string;
  /** Whether the label is a configured label (to translate) or a raw field name. */
  isConfiguredLabel: boolean;
  /** The formatted value. */
  value: string;
}

/** Property keys displayed as date-times in the "all" metadata view. */
const DATETIME_KEYS = ['datetime', 'start_datetime', 'end_datetime', 'created', 'updated'];

/**
 * Utility functions to read and format configurable STAC item fields.
 */
export abstract class StacFieldUtils {
  /**
   * Reads a value in a STAC item using a dot path (e.g., "properties.scale", "assets.thumbnail.href").
   *
   * @param item - The STAC item
   * @param path - The dot path of the field
   * @returns The value, or undefined when the path does not exist
   */
  static getValue(item: StacItem, path: string): unknown {
    return path.split('.').reduce<unknown>((current, key) => {
      if (current && typeof current === 'object') return (current as Record<string, unknown>)[key];
      return undefined;
    }, item);
  }

  /**
   * Formats a field value for display.
   *
   * @param value - The value to format
   * @param format - Optional display format, defaults to "text"
   * @returns The formatted value, or an empty string when the value is empty
   */
  static formatValue(value: unknown, format: StacFieldFormat = 'text'): string {
    if (value === undefined || value === null || value === '') return '';

    switch (format) {
      case 'date':
      case 'datetime': {
        const date = new Date(String(value));
        if (Number.isNaN(date.getTime())) return String(value);
        return format === 'date' ? date.toLocaleDateString() : date.toLocaleString();
      }
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : String(value);
      case 'epsg':
        return String(value).toUpperCase().startsWith('EPSG:') ? String(value) : `EPSG:${String(value)}`;
      case 'json':
        return JSON.stringify(value);
      default:
        if (Array.isArray(value))
          return value.map((entry) => (typeof entry === 'object' ? JSON.stringify(entry) : String(entry))).join(', ');
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }
  }

  /**
   * Gets the formatted value of a configured field for an item.
   *
   * @param item - The STAC item
   * @param field - The field configuration
   * @returns The formatted value, or an empty string when the field is missing
   */
  static getFormattedValue(item: StacItem, field: StacFieldConfig): string {
    return StacFieldUtils.formatValue(StacFieldUtils.getValue(item, field.field), field.format);
  }

  /**
   * Gets the default label of a field, the last segment of its path.
   *
   * @param field - The field configuration
   * @returns The configured label, or the last segment of the field path
   */
  static getLabel(field: StacFieldConfig): string {
    return field.label ?? field.field.split('.').pop() ?? field.field;
  }

  /**
   * Gets the display title of an item.
   *
   * @param item - The STAC item
   * @param titleField - Optional dot path of the title field
   * @returns The title from the configured field, then properties.title, then the item id
   */
  static getTitle(item: StacItem, titleField?: string): string {
    const configured = titleField ? StacFieldUtils.formatValue(StacFieldUtils.getValue(item, titleField)) : '';
    return configured || (item.properties.title ? String(item.properties.title) : item.id);
  }

  /**
   * Gets the 2D lon/lat bbox of an item, supporting 3D bboxes.
   *
   * @param item - The STAC item
   * @returns The bbox [west, south, east, north], or undefined when the item has no valid bbox
   */
  static getBbox(item: StacItem): [number, number, number, number] | undefined {
    const { bbox } = item;
    if (bbox?.length === 4) return [bbox[0], bbox[1], bbox[2], bbox[3]];
    if (bbox?.length === 6) return [bbox[0], bbox[1], bbox[3], bbox[4]];
    return undefined;
  }

  /**
   * Checks whether every item geometry vertex is inside an extent, falling back to the item bbox when geometry is unavailable.
   *
   * @param item - The STAC item to check
   * @param extent - The containing bbox [west, south, east, north]
   * @returns True when the full item geometry or bbox is contained in the extent
   */
  static isItemWithinExtent(item: StacItem, extent: [number, number, number, number]): boolean {
    const coordinates: number[][] = [];
    const visitCoordinates = (value: unknown): void => {
      if (!Array.isArray(value)) return;
      if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
        coordinates.push([value[0], value[1]]);
        return;
      }
      value.forEach(visitCoordinates);
    };
    const visitGeometry = (value: unknown): void => {
      if (!value || typeof value !== 'object') return;
      const geometry = value as { coordinates?: unknown; geometries?: unknown };
      if (geometry.coordinates !== undefined) visitCoordinates(geometry.coordinates);
      if (Array.isArray(geometry.geometries)) geometry.geometries.forEach(visitGeometry);
    };

    visitGeometry(item.geometry);

    if (coordinates.length) {
      return coordinates.every(
        ([longitude, latitude]) => longitude >= extent[0] && latitude >= extent[1] && longitude <= extent[2] && latitude <= extent[3]
      );
    }

    const bbox = StacFieldUtils.getBbox(item);
    return !!bbox && bbox[0] >= extent[0] && bbox[1] >= extent[1] && bbox[2] <= extent[2] && bbox[3] <= extent[3];
  }

  /**
   * Guesses the display format of a raw property for the "all" metadata view.
   *
   * @param key - The property key
   * @param value - The property value
   * @returns The guessed format
   */
  static guessFormat(key: string, value: unknown): StacFieldFormat {
    if (key === 'proj:epsg') return 'epsg';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string' && (DATETIME_KEYS.includes(key) || key.endsWith('_date'))) return 'datetime';
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) return 'url';
    return 'text';
  }

  /**
   * Builds the rows of the metadata view from the item view configuration.
   *
   * With "all" (default), every item property is listed after the id and the collection, minus the excluded fields.
   *
   * @param item - The STAC item
   * @param itemView - Optional item display options
   * @returns The non-empty metadata rows
   */
  static getMetadataRows(item: StacItem, itemView?: StacItemViewConfig): StacMetadataRow[] {
    const excluded = new Set(itemView?.excludeFields ?? []);
    const fields: StacFieldConfig[] =
      itemView?.metadataFields && itemView.metadataFields !== 'all'
        ? itemView.metadataFields
        : [
            { field: 'id' },
            { field: 'collection' },
            { field: 'bbox', format: 'json' },
            ...Object.entries(item.properties).map(([key, value]) => ({
              field: `properties.${key}`,
              format: StacFieldUtils.guessFormat(key, value),
            })),
            ...Object.keys(item.assets ?? {}).map((key) => ({ field: `assets.${key}`, format: 'json' as const })),
          ];

    return fields
      .filter((field) => !excluded.has(field.field))
      .map((field) => {
        const rawValue = StacFieldUtils.getValue(item, field.field);
        const assetHref =
          rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue) && 'href' in rawValue && typeof rawValue.href === 'string'
            ? rawValue.href
            : undefined;
        return {
          field: field.field,
          label: StacFieldUtils.getLabel(field),
          isConfiguredLabel: !!field.label,
          value: assetHref ?? StacFieldUtils.formatValue(rawValue, field.format),
        };
      })
      .filter((row) => row.value !== '');
  }
}

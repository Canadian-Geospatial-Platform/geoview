import { DateMgt, type TemporalMode } from 'geoview-core/core/utils/date-mgt';
import { GeoUtilities } from 'geoview-core/geo/utils/utilities';

import type {
  StacCollection,
  StacDateDisplayOptions,
  StacFieldConfig,
  StacFieldFormat,
  StacItem,
  StacItemViewConfig,
} from './stac-browser-types';

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

/** Matches a date without a time component, displayed as a calendar date so it never shifts a day. */
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Date display used when the caller does not provide the map settings. */
const DEFAULT_DATE_DISPLAY: StacDateDisplayOptions = {
  language: 'en',
  timezone: DateMgt.TIME_UTC,
  dateFormat: DateMgt.ISO_DATE_FORMAT,
  datetimeFormat: DateMgt.ISO_DATETIME_FORMAT_MINUTES,
};

/**
 * Utility functions to read and format the fields of STAC items and collections for display.
 *
 * They give items a stable identity across collections, read values by dot path, and format them
 * (dates through GeoView's DateMgt using the map language, timezone, and date mode). They also expose
 * the item bbox and full-geometry containment checks, backed by the core GeoUtilities.
 */
export abstract class StacFieldUtils {
  // #region STATIC METHODS

  /**
   * Gets a stable key for an item that is unique across collections.
   *
   * @param item - The STAC item
   * @returns The collection-scoped item key, or a self-link/id fallback when its collection is unavailable
   */
  static getItemKey(item: StacItem): string {
    if (item.collection !== undefined) return JSON.stringify(['collection', item.collection, item.id]);
    const selfLink = item.links?.find((link) => link.rel === 'self')?.href;
    return selfLink ? JSON.stringify(['self', selfLink]) : JSON.stringify(['id', item.id]);
  }

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
   * @param dateDisplay - Optional map date settings, defaults to ISO dates in UTC
   * @returns The formatted value, or an empty string when the value is empty
   */
  static formatValue(value: unknown, format: StacFieldFormat = 'text', dateDisplay: StacDateDisplayOptions = DEFAULT_DATE_DISPLAY): string {
    if (value === undefined || value === null || value === '') return '';

    switch (format) {
      case 'date':
      case 'datetime':
        return StacFieldUtils.#formatDate(
          String(value),
          format === 'date' ? dateDisplay.dateFormat : dateDisplay.datetimeFormat,
          dateDisplay
        );
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
   * @param dateDisplay - Optional map date settings
   * @returns The formatted value, or an empty string when the field is missing
   */
  static getFormattedValue(item: StacItem, field: StacFieldConfig, dateDisplay?: StacDateDisplayOptions): string {
    return StacFieldUtils.formatValue(StacFieldUtils.getValue(item, field.field), field.format, dateDisplay);
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
   * Gets the display title of a collection.
   *
   * @param collection - The STAC collection
   * @returns The collection title, or its id when it has no title
   */
  static getCollectionTitle(collection: StacCollection): string {
    return collection.title ?? collection.id;
  }

  /**
   * Formats the first temporal extent interval of a collection as calendar dates.
   *
   * @param collection - The STAC collection
   * @param presentLabel - Translated label shown for an open end
   * @param dateDisplay - Optional map date settings
   * @param yearOnly - Optional whether to show the years only
   * @returns The formatted date range, or an empty string when the collection has no temporal extent
   */
  static formatTemporalExtent(
    collection: StacCollection,
    presentLabel: string,
    dateDisplay: StacDateDisplayOptions = DEFAULT_DATE_DISPLAY,
    yearOnly = false
  ): string {
    const interval = collection.extent?.temporal?.interval?.[0];
    if (!interval) return '';

    const format = yearOnly ? 'YYYY' : dateDisplay.dateFormat;
    const start = interval[0] ? StacFieldUtils.#formatDate(interval[0], format, dateDisplay, 'calendar') : '...';
    const end = interval[1] ? StacFieldUtils.#formatDate(interval[1], format, dateDisplay, 'calendar') : presentLabel;
    return `${start} – ${end}`;
  }

  /**
   * Gets the 2D lon/lat bbox of an item, supporting 3D bboxes.
   *
   * @param item - The STAC item
   * @returns The bbox [west, south, east, north], or undefined when the item has no valid bbox
   */
  static getBbox(item: StacItem): [number, number, number, number] | undefined {
    return GeoUtilities.bboxToExtent2D(item.bbox);
  }

  /**
   * Checks whether every item geometry vertex is inside an extent, falling back to the item bbox when geometry is unavailable.
   *
   * @param item - The STAC item to check
   * @param extent - The containing bbox [west, south, east, north]
   * @returns True when the full item geometry or bbox is contained in the extent
   */
  static isItemWithinExtent(item: StacItem, extent: [number, number, number, number]): boolean {
    const coordinates = GeoUtilities.getGeoJsonCoordinates(item.geometry);
    if (coordinates.length) return coordinates.every((coordinate) => GeoUtilities.isPointInExtent(coordinate, extent));

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
   * @param dateDisplay - Optional map date settings
   * @returns The non-empty metadata rows
   */
  static getMetadataRows(item: StacItem, itemView?: StacItemViewConfig, dateDisplay?: StacDateDisplayOptions): StacMetadataRow[] {
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
          value: assetHref ?? StacFieldUtils.formatValue(rawValue, field.format, dateDisplay),
        };
      })
      .filter((row) => row.value !== '');
  }

  /**
   * Formats a date with DateMgt, keeping the raw value when it cannot be parsed.
   *
   * @param value - The date value
   * @param displayFormat - The Day.js output format
   * @param dateDisplay - The map date settings
   * @param temporalMode - Optional temporal mode, defaults to calendar for date-only values and instant otherwise
   * @returns The formatted date, or the raw value when it is not a valid date
   */
  static #formatDate(value: string, displayFormat: string, dateDisplay: StacDateDisplayOptions, temporalMode?: TemporalMode): string {
    const mode = temporalMode ?? (DATE_ONLY_REGEX.test(value) ? 'calendar' : 'instant');
    if (!DateMgt.parseDateToDayjs(value, undefined, undefined, mode).isValid()) return value;
    return DateMgt.formatDate(value, displayFormat, dateDisplay.language, dateDisplay.timezone, mode);
  }

  // #endregion STATIC METHODS
}

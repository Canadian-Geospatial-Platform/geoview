/**
 * Filter type enumeration.
 */
export type TypeFilterType = 'select' | 'multiselect' | 'range' | 'date';

/**
 * Filter value type - can be single value, array, or range object.
 */
export type TypeFilterValue = string | number | null | (string | number)[] | TypeRangeValue | TypeDateRangeValue;

/**
 * Range value for numeric filters.
 */
export interface TypeRangeValue {
  /** Minimum value. */
  min: number | null;
  /** Maximum value. */
  max: number | null;
}

/**
 * Date range value for date filters.
 */
export interface TypeDateRangeValue {
  /** Start date. */
  start: string | null;
  /** End date. */
  end: string | null;
}

/**
 * Attribute configuration for filtering.
 */
export interface TypeFilterAttribute {
  /** Field name in the layer. */
  fieldName: string;
  /** Display label for the filter. */
  displayLabel: string;
  /** Type of filter control. */
  filterType: TypeFilterType;
  /** Whether this attribute is enabled. */
  enabled: boolean;
  /** Default filter values. */
  defaultValues?: TypeFilterValue;
  /** Optional custom options (if not fetching from layer). */
  options?: (string | number)[];
}

/**
 * Layer configuration for filtering.
 */
export interface TypeFilterLayer {
  /** Unique identifier for the layer (layer path). */
  layerPath: string;
  /** Display name for the layer. */
  layerName: string;
  /** Whether filtering is enabled for this layer. */
  enabled: boolean;
  /** Array of filterable attributes. */
  attributes: TypeFilterAttribute[];
}

/**
 * Filter panel settings.
 */
export interface TypeFilterSettings {
  /** Panel title. */
  title?: string;
  /** Allow collapsing/expanding layer sections. */
  collapsible?: boolean;
  /** Default collapsed state for layer sections. */
  defaultCollapsed?: boolean;
  /** Show reset button. */
  showResetButton?: boolean;
  /** Auto-apply filters on change. */
  autoApply?: boolean;
}

/**
 * Filter panel configuration props.
 */
export interface TypeFilterPanelProps {
  /** Plugin identifier. */
  id: string;
  /** Whether the filter panel is enabled. */
  enabled: boolean;
  /** Whether the panel is open by default. */
  isOpen: boolean;
  /** Configuration version. */
  version: string;
  /** Array of layer configurations. */
  layers: TypeFilterLayer[];
  /** Global filter panel settings. */
  settings: TypeFilterSettings;
}

/**
 * Filter state for a single layer.
 * Maps field names to their current filter values.
 */
export type TypeLayerFilterState = Record<string, TypeFilterValue>;

/**
 * Complete filter state for all layers.
 * Maps layer IDs to their filter states.
 */
export type TypeFilterState = Record<string, TypeLayerFilterState>;

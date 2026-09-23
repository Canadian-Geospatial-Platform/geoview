import type {
  TypeFilterType,
  TypeFilterValue,
  TypeRangeValue,
  TypeDateRangeValue,
  TypeFilterAttribute,
  TypeDomainValue,
} from 'geoview-core/core/stores/states/filter-panel-state';

export type { TypeFilterType, TypeFilterValue, TypeRangeValue, TypeDateRangeValue, TypeFilterAttribute, TypeDomainValue };

/**
 * Layer configuration for filtering.
 */
export interface TypeFilterLayer {
  /** Unique identifier for the layer (layer path). */
  layerPath: string;
  /** Display name for the layer. */
  filterName: string;
  /** Whether filtering is enabled for this layer. */
  enabled: boolean;
  /** Array of filterable attributes. */
  attributes: TypeFilterAttribute[];
  /** Default collapsed state for this layer's filter section. */
  defaultCollapsed?: boolean;
}

/**
 * Filter panel configuration props.
 */
export interface TypeFilterPanelProps {
  /** Plugin identifier. */
  id: string;
  /** Panel title. */
  title: string;
  /** Whether the filter panel is enabled. */
  enabled: boolean;
  /** Whether the panel is open by default. */
  isOpen: boolean;
  /** Configuration version. */
  version: string;
  /** Array of layer configurations. */
  layers: TypeFilterLayer[];
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

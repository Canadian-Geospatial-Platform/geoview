import type { LayerFilters } from '@/core/types/layer-filters';
import type { AbstractBaseGVLayer } from './abstract-base-layer';

/**
 * Contract for layers that support attribute- and date-based filtering.
 * Implementing classes must be able to apply:
 * - a view (attribute) filter coming from the UI
 * - a date range filter
 */
export interface FilterCapable {
  /**
   * Applies an attribute-based filter to the layer.
   * @param {LayerFilters} layerFilters - The set of attribute filters to apply.
   */
  applyViewFilter(layerFilters: LayerFilters): void;

  /**
   * Applies a date range filter to the layer.
   * @param {string} date1 - Start date (inclusive), expressed as an ISO-like string.
   * @param {string} date2 - End date (inclusive), expressed as an ISO-like string.
   */
  applyDateFilter(date1: string, date2: string): void;
}

/**
 * Runtime type guard that checks whether an object implements {@link FilterCapable}.
 * Since TypeScript interfaces do not exist at runtime, this guard relies on
 * structural checks (duck typing) to verify the presence of the expected methods.
 * @param {AbstractBaseGVLayer} layer - The AbstractBaseGVLayer to test.
 * @returns `true` if the layer supports view and date filtering; otherwise `false`.
 */
export const isLayerViewFilterable = (layer: AbstractBaseGVLayer): layer is AbstractBaseGVLayer & FilterCapable => {
  return typeof (layer as unknown as FilterCapable).applyViewFilter === 'function';
};

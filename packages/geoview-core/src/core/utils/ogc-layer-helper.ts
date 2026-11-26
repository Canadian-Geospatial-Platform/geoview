import type { TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';

/**
 * Reads an explicit OGC LAYERS restriction without changing identifier case or decoding twice.
 *
 * @param url - The original, unproxied service URL
 * @returns Requested identifiers, or undefined when LAYERS is absent
 * @throws {GeoViewError} When LAYERS contains an empty identifier
 */
export function getRequestedOgcLayerIds(url: string): string[] | undefined {
  const params = new URL(url, window.location.href).searchParams;
  const values = Array.from(params.entries())
    .filter(([key]): boolean => key.toLowerCase() === 'layers')
    .flatMap(([, value]): string[] => value.split(',').map((id): string => id.trim()));

  if (!values.length) return undefined;
  if (values.some((id): boolean => !id)) throw new GeoViewError('validation.layer.emptyLayersParameter');
  return [...new Set(values)];
}

/**
 * Selects exact advertised entries, retaining a matched group's complete subtree.
 * Unmatched ancestors are omitted rather than becoming selectable, expandable service groups.
 *
 * @param entries - Advertised entries, excluding any synthetic service wrapper
 * @param requestedIds - Requested identifiers, or undefined for unrestricted discovery
 * @returns Only matching entries and descendants of matching groups
 * @throws {GeoViewError} When any requested identifier is not advertised
 */
export function restrictOgcLayerEntries(entries: TypeLayerEntryShell[], requestedIds: string[] | undefined): TypeLayerEntryShell[] {
  if (!requestedIds) return entries;
  const remaining = new Set(requestedIds);

  /**
   * Visits descendants even beneath a match so explicit parent/child requests are both validated.
   *
   * @param candidates - The current advertised subtree
   * @returns Matching subtrees without duplicate parent/child selections
   */
  const selectEntries = (candidates: TypeLayerEntryShell[]): TypeLayerEntryShell[] =>
    candidates.flatMap((entry): TypeLayerEntryShell[] => {
      const matches = requestedIds.includes(`${entry.id}`);
      if (matches) remaining.delete(`${entry.id}`);
      const children = selectEntries(entry.listOfLayerEntryConfig ?? []);
      return matches ? [entry] : children;
    });

  const selected = selectEntries(entries);
  if (remaining.size) {
    throw new GeoViewError('validation.layer.requestedLayersNotFound', { layerIds: [...remaining].join(', ') });
  }
  return selected;
}

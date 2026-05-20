import { Fetch } from 'geoview-core/core/utils/fetch-helper';
import { logger } from 'geoview-core/core/utils/logger';
import type { StacCollection, StacItem, StacItemsResponse, StacSearchParams, StacSearchResult } from './stac-browser-types';

/** Color for collection-level footprint (bbox). */
export const COLLECTION_COLOR = '#1976d2';

/** Color for item-level footprints. */
export const ITEM_COLOR = '#FF8C00';

/**
 * Service class for interacting with STAC APIs.
 */
export class StacApiService {
  /** Base URL of the STAC API. */
  #stacUrl: string;

  /**
   * Creates a STAC API service instance.
   *
   * @param stacUrl - Base URL of the STAC API
   */
  constructor(stacUrl: string) {
    this.#stacUrl = stacUrl.replace(/\/$/, '');
  }

  /**
   * Fetches the list of collections from the STAC API.
   *
   * @returns A promise that resolves with an array of STAC collections
   */
  async fetchCollections(): Promise<StacCollection[]> {
    try {
      const response = await Fetch.fetchJson<{ collections: StacCollection[] }>(`${this.#stacUrl}/collections`);
      return response.collections || [];
    } catch (error) {
      logger.logError('StacApiService.fetchCollections - Failed to fetch collections', error);
      return [];
    }
  }

  /**
   * Searches for STAC items using the POST /search endpoint.
   *
   * @param params - Search parameters
   * @returns A promise that resolves with the search result
   */
  async searchItems(params: StacSearchParams): Promise<StacSearchResult> {
    try {
      const body: Record<string, unknown> = {};
      if (params.collections?.length) body.collections = params.collections;
      if (params.bbox) body.bbox = params.bbox;
      if (params.datetime) body.datetime = params.datetime;
      if (params.q) body.q = params.q;
      if (params.limit) body.limit = params.limit;

      const response = await Fetch.fetchJson<StacSearchResult>(`${this.#stacUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return response;
    } catch (error) {
      logger.logError('StacApiService.searchItems - Failed to search items', error);
      return { type: 'FeatureCollection', features: [] };
    }
  }

  /**
   * Fetches a single STAC item by URL.
   *
   * @param itemUrl - Full URL of the item
   * @returns A promise that resolves with the STAC item, or null on failure
   */
  static async fetchItem(itemUrl: string): Promise<StacItem | null> {
    try {
      return await Fetch.fetchJson<StacItem>(itemUrl);
    } catch (error) {
      logger.logError('StacApiService.fetchItem - Failed to fetch item', error);
      return null;
    }
  }

  /**
   * Fetches the next page of search results by following the next link URL directly.
   *
   * @param nextUrl - Full URL from the search result's next link
   * @returns A promise that resolves with the search result
   */
  static async fetchSearchNextPage(nextUrl: string): Promise<StacSearchResult> {
    try {
      return await Fetch.fetchJson<StacSearchResult>(nextUrl);
    } catch (error) {
      logger.logError('StacApiService.fetchSearchNextPage - Failed to fetch next page', error);
      return { type: 'FeatureCollection', features: [] };
    }
  }

  /**
   * Fetches items belonging to a specific collection.
   *
   * @param collectionId - The collection ID to fetch items for
   * @param limit - Optional max items per page
   * @param nextUrl - Optional full URL from pagination link for next page
   * @returns A promise that resolves with the items response
   */
  async fetchCollectionItems(collectionId: string, limit?: number, nextUrl?: string): Promise<StacItemsResponse> {
    try {
      const url = nextUrl ?? `${this.#stacUrl}/collections/${encodeURIComponent(collectionId)}/items${limit ? `?limit=${limit}` : ''}`;
      return await Fetch.fetchJson<StacItemsResponse>(url);
    } catch (error) {
      logger.logError(`StacApiService.fetchCollectionItems - Failed to fetch items for collection ${collectionId}`, error);
      return { type: 'FeatureCollection', features: [] };
    }
  }

  /**
   * Extracts the next page URL from a global /search response's links.
   *
   * @param result - The search result to extract pagination from
   * @returns The full next page URL, or undefined if no more pages
   */
  static getNextSearchPageUrl(result: StacSearchResult): string | undefined {
    const nextLink = result.links?.find((link) => link.rel === 'next');
    return nextLink?.href;
  }

  /**
   * Extracts the previous page URL from a global /search response's links.
   *
   * @param result - The search result to extract pagination from
   * @returns The full previous page URL, or undefined if on first page
   */
  static getPrevSearchPageUrl(result: StacSearchResult): string | undefined {
    const prevLink = result.links?.find((link) => link.rel === 'prev' || link.rel === 'previous');
    return prevLink?.href;
  }

  /**
   * Extracts the next page URL from a /collections/{id}/items response's links.
   *
   * @param response - The items response to extract pagination from
   * @returns The full next page URL, or undefined if no more pages
   */
  static getNextPageUrl(response: StacItemsResponse): string | undefined {
    const nextLink = response.links?.find((link) => link.rel === 'next');
    return nextLink?.href;
  }

  /**
   * Extracts the previous page URL from a /collections/{id}/items response's links.
   *
   * @param response - The items response to extract pagination from
   * @returns The full previous page URL, or undefined if on first page
   */
  static getPrevPageUrl(response: StacItemsResponse): string | undefined {
    const prevLink = response.links?.find((link) => link.rel === 'prev' || link.rel === 'previous');
    return prevLink?.href;
  }

  /**
   * Formats a collection's temporal extent interval for display.
   *
   * @param collection - The STAC collection to extract temporal extent from
   * @param yearOnly - Optional whether to show year only instead of full date
   * @returns Formatted date range string, or empty string if unavailable
   */
  static formatTemporalExtent(collection: StacCollection, yearOnly?: boolean): string {
    const interval = collection.extent?.temporal?.interval?.[0];
    if (!interval) return '';

    let start: string | number = '...';
    if (interval[0]) {
      const date = new Date(interval[0]);
      start = yearOnly ? date.getFullYear() : date.toLocaleDateString();
    }

    let end: string | number = 'present';
    if (interval[1]) {
      const date = new Date(interval[1]);
      end = yearOnly ? date.getFullYear() : date.toLocaleDateString();
    }

    return `${start} – ${end}`;
  }
}

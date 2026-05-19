import { Fetch } from 'geoview-core/core/utils/fetch-helper';
import { logger } from 'geoview-core/core/utils/logger';
import type { StacCollection, StacItem, StacItemsResponse, StacSearchParams, StacSearchResult } from './stac-browser-types';

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
      if (params.token) body.token = params.token;

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
   * Extracts the next page token from a search result's links.
   *
   * @param result - The search result to extract pagination from
   * @returns The next page token, or undefined if no more pages
   */
  getNextPageToken(result: StacSearchResult): string | undefined {
    const nextLink = result.links?.find((link) => link.rel === 'next');
    if (!nextLink) return undefined;

    // Token can be in the href as a query param or in the link body
    const url = new URL(nextLink.href, this.#stacUrl);
    return url.searchParams.get('token') ?? undefined;
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
   * Extracts the next page URL from an items response's links.
   *
   * @param response - The items response to extract pagination from
   * @returns The full next page URL, or undefined if no more pages
   */
  getNextPageUrl(response: StacItemsResponse): string | undefined {
    const nextLink = response.links?.find((link) => link.rel === 'next');
    return nextLink?.href;
  }

  /**
   * Extracts the previous page URL from an items response's links.
   *
   * @param response - The items response to extract pagination from
   * @returns The full previous page URL, or undefined if on first page
   */
  getPrevPageUrl(response: StacItemsResponse): string | undefined {
    const prevLink = response.links?.find((link) => link.rel === 'prev' || link.rel === 'previous');
    return prevLink?.href;
  }
}

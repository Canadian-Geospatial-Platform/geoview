import { Fetch } from 'geoview-core/core/utils/fetch-helper';
import { logger } from 'geoview-core/core/utils/logger';
import { NetworkError, RequestTimeoutError, ResponseError } from 'geoview-core/core/exceptions/core-exceptions';
import { StacFieldUtils } from './stac-field-utils';
import type {
  StacCapabilities,
  StacCollection,
  StacCollectionsConfig,
  StacItem,
  StacItemsResponse,
  StacLandingPage,
  StacLink,
  StacQueryableField,
  StacQueryables,
  StacSearchParams,
  StacSearchResult,
  StacSortBy,
} from './stac-browser-types';

/** Color for collection-level footprint (bbox). */
export const COLLECTION_COLOR = '#1976d2';

/** Default fill opacity for collection-level footprints. */
export const COLLECTION_FILL_OPACITY = 0.2;

/** Color for item-level footprints. */
export const ITEM_COLOR = '#FF8C00';

/** Default fill opacity for search-result footprints. */
export const SEARCH_FILL_OPACITY = 0.25;

/** Colors assigned to the selected items, distinct from the collection and item footprint colors. */
export const SELECTION_COLORS = ['#e53935', '#43a047', '#fdd835', '#8e24aa', '#00acc1', '#d81b60', '#7cb342', '#5e35b1'];

/** Default number of items per page when not configured. */
export const DEFAULT_PAGE_LIMIT = 20;

/** Capabilities assumed when the server landing page cannot be read. */
const FALLBACK_CAPABILITIES: StacCapabilities = { freeText: false, searchSort: false, itemsSort: false, cql2Json: false };

/** State needed to continue a client-side contained search across an API page boundary. */
interface StacContainedSearchCursor {
  /** Matching features already fetched but not yet returned to the UI. */
  bufferedItems: StacItem[];
  /** Next raw API page to inspect. */
  nextRawLink?: StacLink;
  /** Original request parameters. */
  params: StacSearchParams;
  /** Bbox in which every returned item must fit. */
  extent: [number, number, number, number];
}

/**
 * Service class for interacting with STAC APIs.
 *
 * Request failures are not swallowed: the typed errors from the Fetch helper propagate to the caller.
 */
export class StacApiService {
  /** Base URL of the STAC API. */
  #stacUrl: string;

  /** URL of the POST /search endpoint, resolved from the landing page links when available. */
  #searchUrl: string;

  /** Whether searches use GET instead of POST, set once a POST search is blocked. */
  #isSearchUsingGet = false;

  /** Saved cursors for app pages assembled from one or more raw STAC API pages. */
  #containedSearchCursors = new Map<string, StacContainedSearchCursor>();

  /** Sequence used to generate opaque contained-search page cursors. */
  #containedCursorSequence = 0;

  /** Queryable schemas cached by collection id (or the catalog-level empty key). */
  #queryablesCache = new Map<string, Record<string, StacQueryableField>>();

  /**
   * Creates a STAC API service instance.
   *
   * @param stacUrl - Base URL of the STAC API
   */
  constructor(stacUrl: string) {
    this.#stacUrl = stacUrl.replace(/\/$/, '');
    this.#searchUrl = `${this.#stacUrl}/search`;
  }

  /**
   * Fetches the landing page and detects the optional features supported by the server.
   *
   * Also resolves the search endpoint from the landing page links. When the landing page is unreachable
   * (network, CORS, HTTP or timeout error), optional features are disabled instead of failing the browser.
   *
   * @returns A promise that resolves with the server capabilities
   */
  async fetchCapabilities(): Promise<StacCapabilities> {
    try {
      // Trailing slash required: some servers (e.g. datacube) answer the bare root with a 301 that has no CORS header
      const landing = await Fetch.fetchJson<StacLandingPage>(`${this.#stacUrl}/`);

      const searchLink = landing.links?.find((link) => link.rel === 'search' && link.method !== 'GET');
      if (searchLink?.href) this.#searchUrl = searchLink.href;

      let conformsTo = landing.conformsTo ?? [];
      if (!conformsTo.length) {
        const conformance = await Fetch.fetchJson<{ conformsTo?: string[] }>(`${this.#stacUrl}/conformance`);
        conformsTo = conformance.conformsTo ?? [];
      }

      return {
        freeText: conformsTo.some((uri) => uri.includes('free-text')),
        searchSort: conformsTo.some((uri) => uri.includes('item-search#sort') || uri.includes('ogcapi-features#sort')),
        itemsSort: conformsTo.some((uri) => uri.includes('ogcapi-features#sort')),
        cql2Json: conformsTo.some((uri) => uri.includes('cql2-json')),
      };
    } catch (error: unknown) {
      if (!(error instanceof NetworkError || error instanceof ResponseError || error instanceof RequestTimeoutError)) throw error;
      logger.logWarning(`StacApiService - Could not read the STAC landing page of ${this.#stacUrl}, optional features disabled`, error);
      return FALLBACK_CAPABILITIES;
    }
  }

  /**
   * Fetches the list of collections from the STAC API.
   *
   * @returns A promise that resolves with an array of STAC collections
   * @throws {ResponseError | NetworkError | RequestTimeoutError} When the request fails
   */
  async fetchCollections(): Promise<StacCollection[]> {
    const response = await Fetch.fetchJson<{ collections?: StacCollection[] }>(`${this.#stacUrl}/collections`);
    return response.collections ?? [];
  }

  /**
   * Fetches queryable property schemas for the selected collections.
   *
   * For multiple collections, only fields advertised by every selected collection are returned so one CQL2 filter is valid for the whole search.
   *
   * @param collectionIds - Optional selected collection IDs; omitted means catalog-level queryables
   * @returns A promise that resolves with queryable properties keyed by their STAC field name
   */
  async fetchQueryables(collectionIds?: string[]): Promise<Record<string, StacQueryableField>> {
    const ids = collectionIds?.length ? collectionIds : undefined;
    if (!ids) {
      return this.#fetchQueryablesForCollection('');
    }

    const responses = await Promise.all(ids.map((collectionId) => this.#fetchQueryablesForCollection(collectionId)));
    if (responses.length === 1) return responses[0];

    const commonFields = Object.keys(responses[0]).filter((field) => responses.every((response) => !!response[field]));
    return Object.fromEntries(commonFields.map((field) => [field, responses[0][field]]));
  }

  /**
   * Fetches and caches queryables for one collection or the catalog.
   *
   * @param collectionId - Collection ID, or an empty string for catalog queryables
   * @returns A promise that resolves with queryable properties keyed by field name
   */
  async #fetchQueryablesForCollection(collectionId: string): Promise<Record<string, StacQueryableField>> {
    const cached = this.#queryablesCache.get(collectionId);
    if (cached) return cached;

    const url = collectionId
      ? `${this.#stacUrl}/collections/${encodeURIComponent(collectionId)}/queryables`
      : `${this.#stacUrl}/queryables`;
    const queryables = await Fetch.fetchJson<StacQueryables>(url);
    const properties = queryables.properties ?? {};
    this.#queryablesCache.set(collectionId, properties);
    return properties;
  }

  /**
   * Searches for STAC items using the POST /search endpoint, falling back to GET /search when POST is blocked.
   *
   * @param params - Search parameters
   * @param fullyContainedExtent - Optional bbox requiring every returned item's geometry to be fully contained
   * @returns A promise that resolves with the search result
   * @throws {ResponseError | NetworkError | RequestTimeoutError} When the request fails
   */
  async searchItems(params: StacSearchParams, fullyContainedExtent?: [number, number, number, number]): Promise<StacSearchResult> {
    if (fullyContainedExtent) {
      this.#containedSearchCursors.clear();
      const firstPage = await this.#searchRawItems(params);
      return this.#assembleContainedPage(firstPage.features, StacApiService.getPageLink(firstPage, 'next'), params, fullyContainedExtent);
    }

    return this.#searchRawItems(params);
  }

  /**
   * Sends a raw initial search request, falling back to GET /search when POST is blocked.
   *
   * @param params - Search parameters
   * @returns A promise that resolves with the raw search result
   */
  async #searchRawItems(params: StacSearchParams): Promise<StacSearchResult> {
    if (!this.#isSearchUsingGet) {
      try {
        return await StacApiService.#postJson<StacSearchResult>(this.#searchUrl, StacApiService.#buildSearchBody(params));
      } catch (error: unknown) {
        if (!(error instanceof NetworkError)) throw error;

        // TODO: Ask the datacube team to allow OPTIONS (CORS preflight) on /search, then remove this GET fallback.
        // The JSON POST triggers a CORS preflight that datacube answers with a 403, while a plain GET is allowed.
        logger.logWarning(`StacApiService - POST ${this.#searchUrl} blocked (likely CORS preflight), falling back to GET`, error);
        this.#isSearchUsingGet = true;
      }
    }

    return Fetch.fetchJson<StacSearchResult>(`${this.#searchUrl}?${StacApiService.#buildSearchQuery(params)}`);
  }

  /**
   * Fetches a page of search results by following a pagination link.
   *
   * POST links (STAC API spec) are followed with their body, merged with the original request when requested.
   *
   * @param link - The next or previous link of a search result
   * @param params - The search parameters of the original request
   * @param fullyContainedExtent - Optional bbox requiring every returned item's geometry to be fully contained
   * @returns A promise that resolves with the search result
   * @throws {ResponseError | NetworkError | RequestTimeoutError} When the request fails
   */
  async fetchSearchPage(
    link: StacLink,
    params: StacSearchParams,
    fullyContainedExtent?: [number, number, number, number]
  ): Promise<StacSearchResult> {
    if (link.href.startsWith('stac-contained-page:')) {
      const cursor = this.#containedSearchCursors.get(link.href);
      if (!cursor) throw new Error('The contained STAC search page cursor is no longer available');
      this.#containedSearchCursors.delete(link.href);
      return this.#assembleContainedPage(cursor.bufferedItems, cursor.nextRawLink, cursor.params, cursor.extent);
    }

    const rawPage = await StacApiService.#fetchRawSearchPage(link, params);
    if (!fullyContainedExtent) return rawPage;

    return this.#assembleContainedPage(rawPage.features, StacApiService.getPageLink(rawPage, 'next'), params, fullyContainedExtent);
  }

  /**
   * Fetches one raw API search page, following GET or POST pagination links.
   *
   * @param link - The next or previous link of a search result
   * @param params - The original search parameters
   * @returns A promise that resolves with the raw page
   */
  static #fetchRawSearchPage(link: StacLink, params: StacSearchParams): Promise<StacSearchResult> {
    if (link.method !== 'POST') return Fetch.fetchJson<StacSearchResult>(link.href);

    const originalBody = StacApiService.#buildSearchBody(params);
    let body = originalBody;
    if (link.body) body = link.merge ? { ...originalBody, ...link.body } : link.body;
    return StacApiService.#postJson<StacSearchResult>(link.href, body);
  }

  /**
   * Builds one full UI page of strict-contained matches, consuming subsequent API pages as needed.
   *
   * @param bufferedItems - Items already fetched and not yet tested or returned
   * @param nextRawLink - Next raw API page to inspect
   * @param params - Original request parameters
   * @param extent - Bbox requiring full item containment
   * @returns A promise that resolves with one UI page of contained items
   */
  async #assembleContainedPage(
    bufferedItems: StacItem[],
    nextRawLink: StacLink | undefined,
    params: StacSearchParams,
    extent: [number, number, number, number]
  ): Promise<StacSearchResult> {
    const pageSize = params.limit ?? DEFAULT_PAGE_LIMIT;
    const matchingItems = bufferedItems.filter((item) => StacFieldUtils.isItemWithinExtent(item, extent));

    let rawLink = nextRawLink;
    while (matchingItems.length < pageSize && rawLink) {
      // The next cursor depends on the response from the previous page.
      // eslint-disable-next-line no-await-in-loop
      const rawPage = await StacApiService.#fetchRawSearchPage(rawLink, params);
      rawLink = StacApiService.getPageLink(rawPage, 'next');
      matchingItems.push(...rawPage.features.filter((item) => StacFieldUtils.isItemWithinExtent(item, extent)));
    }

    const features = matchingItems.slice(0, pageSize);
    const overflowItems = matchingItems.slice(pageSize);
    const nextLink =
      overflowItems.length || rawLink
        ? this.#createContainedSearchCursor({ bufferedItems: overflowItems, nextRawLink: rawLink, params, extent })
        : undefined;

    return {
      type: 'FeatureCollection',
      features,
      numberReturned: features.length,
      ...(nextLink && { links: [nextLink] }),
    };
  }

  /**
   * Saves and returns a cursor for the next assembled page.
   *
   * @param cursor - The state needed to build the next page
   * @returns The opaque next-page link
   */
  #createContainedSearchCursor(cursor: StacContainedSearchCursor): StacLink {
    const href = `stac-contained-page:${this.#containedCursorSequence++}`;
    this.#containedSearchCursors.set(href, cursor);
    return { href, rel: 'next' };
  }

  /**
   * Fetches a single STAC item by URL.
   *
   * @param itemUrl - Full URL of the item
   * @returns A promise that resolves with the STAC item
   * @throws {ResponseError | NetworkError | RequestTimeoutError} When the request fails
   */
  static fetchItem(itemUrl: string): Promise<StacItem> {
    return Fetch.fetchJson<StacItem>(itemUrl);
  }

  /**
   * Fetches items belonging to a specific collection.
   *
   * @param collectionId - The collection ID to fetch items for
   * @param limit - Optional max items per page
   * @param sortby - Optional sort criteria (only send when the server supports sorting)
   * @param pageUrl - Optional full URL from a pagination link
   * @returns A promise that resolves with the items response
   * @throws {ResponseError | NetworkError | RequestTimeoutError} When the request fails
   */
  fetchCollectionItems(collectionId: string, limit?: number, sortby?: StacSortBy[], pageUrl?: string): Promise<StacItemsResponse> {
    if (pageUrl) return Fetch.fetchJson<StacItemsResponse>(pageUrl);

    const query = new URLSearchParams();
    if (limit) query.set('limit', String(limit));
    if (sortby?.length) query.set('sortby', StacApiService.#formatSortByQuery(sortby));
    const queryString = query.toString();

    const url = `${this.#stacUrl}/collections/${encodeURIComponent(collectionId)}/items${queryString ? `?${queryString}` : ''}`;
    return Fetch.fetchJson<StacItemsResponse>(url);
  }

  /**
   * Finds a pagination link in a STAC response.
   *
   * @param response - The response holding the links
   * @param direction - The pagination direction
   * @returns The pagination link, or undefined when there is no such page
   */
  static getPageLink(response: { links?: StacLink[] }, direction: 'next' | 'prev'): StacLink | undefined {
    const rels = direction === 'next' ? ['next'] : ['prev', 'previous'];
    return response.links?.find((link) => rels.includes(link.rel));
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

  /**
   * Builds the POST /search request body from the search parameters.
   *
   * @param params - Search parameters
   * @returns The request body
   */
  static #buildSearchBody(params: StacSearchParams): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    if (params.collections?.length) body.collections = params.collections;
    if (params.bbox) body.bbox = params.bbox;
    if (params.datetime) body.datetime = params.datetime;
    if (params.q) body.q = params.q;
    if (params.limit) body.limit = params.limit;
    if (params.sortby?.length) body.sortby = params.sortby;
    if (params.filter) {
      body.filter = params.filter;
      body['filter-lang'] = params.filterLang ?? 'cql2-json';
    }
    return body;
  }

  /**
   * Builds the GET /search query string from the search parameters.
   *
   * @param params - Search parameters
   * @returns The URL-encoded query string
   */
  static #buildSearchQuery(params: StacSearchParams): string {
    const query = new URLSearchParams();
    if (params.collections?.length) query.set('collections', params.collections.join(','));
    if (params.bbox) query.set('bbox', params.bbox.join(','));
    if (params.datetime) query.set('datetime', params.datetime);
    if (params.q) query.set('q', params.q);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.sortby?.length) query.set('sortby', StacApiService.#formatSortByQuery(params.sortby));
    if (params.filter) {
      query.set('filter', JSON.stringify(params.filter));
      query.set('filter-lang', params.filterLang ?? 'cql2-json');
    }
    return query.toString();
  }

  /**
   * Formats sort criteria for a GET query (e.g., "-datetime,+id").
   *
   * @param sortby - The sort criteria
   * @returns The sortby query value
   */
  static #formatSortByQuery(sortby: StacSortBy[]): string {
    return sortby.map((sort) => `${sort.direction === 'desc' ? '-' : '+'}${sort.field}`).join(',');
  }

  /**
   * Posts a JSON body and parses the JSON response.
   *
   * @param url - The URL to post to
   * @param body - The JSON body
   * @returns A promise that resolves with the parsed response
   * @throws {ResponseError | NetworkError | RequestTimeoutError} When the request fails
   */
  static #postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
    return Fetch.fetchJson<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
}

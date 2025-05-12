import type { StacCatalog, StacCollection, StacItem } from './Types';

/**
 * Fetch and return the stac id.
 * @param url Stac root URL.
 * @returns Promise for a JSX.Element of a label for the STAC ID.
 */
export async function stacRootRequest(url: string): Promise<JSX.Element> {
  const endpoint = '/';
  const resp = await fetch(url + endpoint);
  const json = (await resp.json()) as StacCatalog;
  return <p> {json.id} </p>;
}

/**
 * Fetch and return a list of STAC Collection objects.
 * @param url STAC Collections URL.
 * @returns List of STAC Collections.
 */
export async function stacCollectionsRequest(url: string): Promise<StacCollection[]> {
  const endpoint = '/collections';
  const resp = await fetch(url + endpoint);
  const data = (await resp.json()) as { collections: StacCollection[] };
  const { collections } = data;
  return collections;
}

/**
 * Fetch and return a list of STAC Items.
 * @param url STAC Items URL.
 * @returns List of STAC Items.
 */
export async function stacItemsRequest(url: string): Promise<StacItem[]> {
  const resp = await fetch(url);
  const data = (await resp.json()) as { features: StacItem[] };
  return data.features;
}

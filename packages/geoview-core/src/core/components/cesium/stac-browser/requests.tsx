import type { StacCatalog, StacCollection, StacItem } from './Types';

export async function stacRootRequest(url: string): Promise<JSX.Element> {
  const endpoint = '/';
  const resp = await fetch(url + endpoint);
  const json = (await resp.json()) as StacCatalog;
  return <p> {json.id} </p>;
}

export async function stacCollectionsRequest(url: string): Promise<StacCollection[]> {
  const endpoint = '/collections';
  const resp = await fetch(url + endpoint);
  const data = (await resp.json()) as { collections: StacCollection[] };
  const { collections } = data;
  return collections;
}

export async function stacItemsRequest(url: string): Promise<StacItem[]> {
  const resp = await fetch(url);
  const data = (await resp.json()) as { features: StacItem[] };
  return data.features;
}

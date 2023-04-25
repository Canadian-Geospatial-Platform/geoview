export interface GeoListItem {
  key: string;
  name: string;
  lat: number;
  lng: number;
  bbox: number[];
  province: string;
  tag: (string | null)[] | null;
}

export interface State<T> {
  data?: T;
  error?: Error;
  loading?: boolean;
  reset?: () => void;
}

export type Action<T> = { type: 'loading' } | { type: 'fetched'; payload: T } | { type: 'error'; payload: Error } | { type: 'reset' };

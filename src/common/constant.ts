// Repositry URL for GitHub
export const GITUHUB_REPO = 'https://github.com/Canadian-Geospatial-Platform/GeoView';

// Classes used by Leaflet to position controls
export const LEAFLET_POSITION_CLASSES = {
    bottomleft: 'leaflet-bottom leaflet-left',
    bottomright: 'leaflet-bottom leaflet-right',
    topleft: 'leaflet-top leaflet-left',
    topright: 'leaflet-top leaflet-right',
};

/**
 * An object containing version information.
 *
 * @export
 * @interface AppVersion
 */
export interface AppVersion {
    hash: string;
    major: number;
    minor: number;
    patch: number;
    timestamp: string;
}

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
 * Generate a unique id if an id was not provided
 *
 * @param {string} id an id to return if it was already passed
 *
 * @returns the generated id
 */
export const generateId = (id: string | undefined | null): string => {
    return id !== null && id !== undefined && id.length > 0
        ? id
        : (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
};

// The north pole position use for north arrow marker and get north arrow rotation angle
export const northPolePosition: number[] = [90, -95];

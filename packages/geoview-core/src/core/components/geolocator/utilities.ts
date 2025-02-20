import { GeoListItem } from '@/core/components/geolocator/geolocator';
import { TypeMenuItemProps } from '@/ui';

export type tooltipProp = Pick<GeoListItem, 'name' | 'province' | 'category'>;

export const SEARCH_PATTERNS = {
  SPACES_AND_COMMAS: /[ ,]*/,
  SPECIAL_CHARS: /[.*+?^${}()|[\]\\]/g,
  POSTAL_CODE: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i,
  LAT_LONG: /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)[\s,;|]\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/,
  LAT_LONG_DELIMITER: /[\s,;|]+/,
} as const;

/**
 * Remove spaces if term is a postal code
 * @param {string} searchTerm - The search term user searched
 * @returns {string} The currated postal code
 */
export const cleanPostalCode = (searchTerm: string): string => {
  // Clean the input
  const cleanTerm = searchTerm.trim().toUpperCase();

  // Check if it's a valid postal code
  if (SEARCH_PATTERNS.POSTAL_CODE.test(cleanTerm)) {
    // Remove any spaces and return uppercase
    return cleanTerm.replace(/\s+/g, '');
  }

  return searchTerm;
};

/**
 * Checks if search term is decimal degree coordinate and return geo list item.
 * @param {string} searchTerm - The search term user searched
 * @returns GeoListItem | null
 */
export const getDecimalDegreeItem = (searchTerm: string): GeoListItem | null => {
  if (!SEARCH_PATTERNS.LAT_LONG.test(searchTerm)) return null;

  // Remove extra spaces and delimiters (the filter) then convert string numbers to float numbers
  const coords = searchTerm
    .split(SEARCH_PATTERNS.LAT_LONG_DELIMITER)
    .filter((n) => !Number.isNaN(n) && n !== '')
    .map((n) => parseFloat(n));

  // Apply buffer (degree) to create bbox from point coordinates
  const buff = 0.015;
  const boundingBox: [number, number, number, number] = [coords[1] - buff, coords[0] - buff, coords[1] + buff, coords[0] + buff];

  // Return the lat/long result that needs to be generated along with name based results
  return {
    key: 'coordinates',
    name: `${coords[0]},${coords[1]}`,
    lat: coords[0],
    lng: coords[1],
    bbox: boundingBox,
    province: '',
    category: 'Latitude/Longitude',
  };
};

/**
 * Get the title for tooltip
 * @param {string} name - The name of the geo item
 * @param {string} province - The province of the geo item
 * @param {category} category - The category of the geo item
 * @returns {string} The tooltip title
 */
export const getTooltipTitle = ({ name, province, category }: tooltipProp): string => {
  return [name, category !== 'null' && category, province !== 'null' && province].filter(Boolean).join(', ');
};

/**
 * Makes matching text bold in a title string.
 * @param {string} title - The list title in search result
 * @param {string} searchValue - The value that user search
 * @returns {string} The bolded title string
 */
export const getBoldListTitle = (title: string, searchValue: string): string => {
  if (!searchValue || !title) return title;

  // Check pattern
  const searchPattern = `${searchValue.replace(SEARCH_PATTERNS.SPECIAL_CHARS, '\\$&')}`.replace(
    /\s+/g,
    SEARCH_PATTERNS.SPACES_AND_COMMAS.source
  );
  const pattern = new RegExp(searchPattern, 'i');

  return pattern.test(title) ? title.replace(pattern, '<strong>$&</strong>') : title;
};

/**
 * Creates menu items from a list of unique values from geoLocationData
 * @param {GeoListItem[]} geoLocationData - The source data array
 * @param {string} field - The field to extract values from ('province' | 'category')
 * @param {string} noFilterText - The text to display for the empty filter option
 * @returns {TypeMenuItemProps[]} Array of menu items
 */
export const createMenuItems = (
  geoLocationData: GeoListItem[],
  field: 'province' | 'category',
  noFilterText: string
): TypeMenuItemProps[] => {
  // Use Set for unique values
  const uniqueValues = new Set(
    geoLocationData
      .map((item) => item[field])
      .filter((value): value is string => Boolean(value))
      .sort()
  );

  return [
    {
      type: 'item' as const,
      item: {
        value: '',
        children: noFilterText,
      },
    },
    ...Array.from(uniqueValues).map((value) => ({
      type: 'item' as const,
      item: {
        value,
        children: value,
      },
    })),
  ];
};

import { GeoListItem } from '@/core/components/geolocator/geolocator';
import { TypeMenuItemProps } from '@/ui';
export type tooltipProp = Pick<GeoListItem, 'name' | 'province' | 'category'>;
export declare const SEARCH_PATTERNS: {
    readonly SPACES_AND_COMMAS: RegExp;
    readonly SPECIAL_CHARS: RegExp;
    readonly POSTAL_CODE: RegExp;
    readonly LAT_LONG: RegExp;
    readonly LAT_LONG_DELIMITER: RegExp;
};
/**
 * Remove spaces if term is a postal code
 * @param {string} searchTerm - The search term user searched
 * @returns {string} The currated postal code
 */
export declare const cleanPostalCode: (searchTerm: string) => string;
/**
 * Checks if search term is decimal degree coordinate and return geo list item.
 * @param {string} searchTerm - The search term user searched
 * @returns GeoListItem | null
 */
export declare const getDecimalDegreeItem: (searchTerm: string) => GeoListItem | null;
/**
 * Get the title for tooltip
 * @param {string} name - The name of the geo item
 * @param {string} province - The province of the geo item
 * @param {category} category - The category of the geo item
 * @returns {string} The tooltip title
 */
export declare const getTooltipTitle: ({ name, province, category }: tooltipProp) => string;
/**
 * Makes matching text bold in a title string.
 * @param {string} title - The list title in search result
 * @param {string} searchValue - The value that user search
 * @returns {string} The bolded title string
 */
export declare const getBoldListTitle: (title: string, searchValue: string) => string;
/**
 * Creates menu items from a list of unique values from geoLocationData
 * @param {GeoListItem[]} geoLocationData - The source data array
 * @param {string} field - The field to extract values from ('province' | 'category')
 * @param {string} noFilterText - The text to display for the empty filter option
 * @returns {TypeMenuItemProps[]} Array of menu items
 */
export declare const createMenuItems: (geoLocationData: GeoListItem[], field: "province" | "category", noFilterText: string) => TypeMenuItemProps[];

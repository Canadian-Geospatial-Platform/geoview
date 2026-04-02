import type { GeoListItem } from '@/core/components/geolocator/geolocator';
import type { TypeMenuItemProps } from '@/ui';
/** Tooltip property type picking name, province, and category from GeoListItem. */
export type tooltipProp = Pick<GeoListItem, 'name' | 'province' | 'category'>;
/** Regex patterns used for parsing search terms. */
export declare const SEARCH_PATTERNS: {
    readonly SPACES_AND_COMMAS: RegExp;
    readonly SPECIAL_CHARS: RegExp;
    readonly POSTAL_CODE: RegExp;
    readonly LAT_LONG: RegExp;
    readonly LAT_LONG_DELIMITER: RegExp;
};
/**
 * Removes spaces if the term is a postal code.
 *
 * @param searchTerm - The search term user searched
 * @returns The curated postal code
 */
export declare const cleanPostalCode: (searchTerm: string) => string;
/**
 * Checks if search term is a decimal degree coordinate and returns a geo list item.
 *
 * @param searchTerm - The search term user searched
 * @returns The geo list item, or null if not a coordinate
 */
export declare const getDecimalDegreeItem: (searchTerm: string) => GeoListItem | null;
/**
 * Gets the title for tooltip.
 *
 * @param name - The name of the geo item
 * @param province - The province of the geo item
 * @param category - The category of the geo item
 * @returns The tooltip title
 */
export declare const getTooltipTitle: ({ name, province, category }: tooltipProp) => string;
/**
 * Makes matching text bold in a title string.
 *
 * @param title - The list title in search result
 * @param searchValue - The value that user searched
 * @returns The bolded title string
 */
export declare const getBoldListTitle: (title: string, searchValue: string) => string;
/**
 * Creates menu items from a list of unique values from geoLocationData.
 *
 * @param geoLocationData - The source data array
 * @param field - The field to extract values from ('province' | 'category')
 * @param noFilterText - The text to display for the empty filter option
 * @returns Array of menu items
 */
export declare const createMenuItems: (geoLocationData: GeoListItem[], field: "province" | "category", noFilterText: string) => TypeMenuItemProps[];
//# sourceMappingURL=utilities.d.ts.map
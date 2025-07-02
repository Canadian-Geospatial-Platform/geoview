import { GeoListItem } from '@/core/components/geolocator/geolocator';
interface UseGeolocatorReturn {
    /** Array of geolocation results */
    data: GeoListItem[] | undefined;
    /** Loading state during requests */
    isLoading: boolean;
    /** Current search input value */
    searchValue: string;
    /** Error value */
    error: boolean;
    /** Function to update search value */
    setSearchValue: (value: string) => void;
    /** Function to trigger geolocation search */
    getGeolocations: (searchTerm: string) => void;
    /** Function to reset the hook state */
    resetState: () => void;
}
export declare const useGeolocator: () => UseGeolocatorReturn;
export {};
//# sourceMappingURL=use-geolocator.d.ts.map
import type { ChangeEvent } from 'react';
/** Props for the GeolocatorBar component. */
interface GeolocatorBarProps {
    /** Current search input value */
    searchValue: string;
    /** Called when search input changes */
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** Called when search is triggered (via button or form submit) */
    onSearch: () => void;
    /** Called when reset/clear button is clicked */
    onReset: () => void;
    /** Loading state to disable search while fetching */
    isLoading: boolean;
    /** Ref for the search input element */
    inputRef?: React.RefObject<HTMLInputElement>;
}
/**
 * Creates the geolocator search bar component.
 *
 * @param props - Properties defined in GeolocatorBarProps interface
 * @returns The geolocator bar
 */
export declare function GeolocatorBar({ searchValue, onChange, onSearch, onReset, isLoading, inputRef }: GeolocatorBarProps): JSX.Element;
export {};
//# sourceMappingURL=geolocator-bar.d.ts.map
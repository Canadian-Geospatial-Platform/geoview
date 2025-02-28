import { ChangeEvent } from 'react';
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
}
export declare function GeolocatorBar({ searchValue, onChange, onSearch, onReset, isLoading }: GeolocatorBarProps): JSX.Element;
export {};

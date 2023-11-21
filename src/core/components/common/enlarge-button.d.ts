import { Dispatch } from 'react';
interface EnlargeButtonProps {
    isEnlargeDataTable: boolean;
    setIsEnlargeDataTable: Dispatch<boolean>;
}
/**
 * Create enlarge button
 * @param {boolean} isEnlargeDataTable
 * @param {function} setIsEnlargeDataTable
 * @returns JSX.element
 */
export declare function EnlargeButton({ isEnlargeDataTable, setIsEnlargeDataTable }: EnlargeButtonProps): import("react").JSX.Element;
export {};

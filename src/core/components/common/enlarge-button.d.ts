import { Dispatch } from 'react';
interface EnlargeButtonProps {
    isEnlarged: boolean;
    onSetIsEnlarged: Dispatch<boolean>;
}
/**
 * Create enlarge button
 * @param {boolean} isEnlarged
 * @param {function} setIsEnlarged
 * @returns JSX.element
 */
export declare function EnlargeButton({ isEnlarged, onSetIsEnlarged }: EnlargeButtonProps): import("react").JSX.Element;
export {};

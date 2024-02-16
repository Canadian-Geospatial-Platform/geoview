import React from 'react';
export interface TypeIconStackProps {
    layerPath: string;
    onIconClick?: () => void;
    onStackIconClick?: (e: React.KeyboardEvent<HTMLElement>) => void;
}
/**
 * Icon Stack to represent layer icons
 *
 * @param {string} layerPath
 * @returns {JSX.Element} the icon stack item
 */
export declare function IconStack({ layerPath, onIconClick, onStackIconClick }: TypeIconStackProps): JSX.Element | null;

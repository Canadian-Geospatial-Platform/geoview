import React from 'react';
import { PopperProps } from '@mui/material';
interface EnhancedPopperProps extends PopperProps {
    onClose?: () => void;
    handleKeyDown?: (key: string, callbackFn: () => void) => void;
}
/**
 * Create a popover component
 *
 * @param {EnhancedPopperProps} props popover properties
 * @returns {JSX.Element} returns popover component
 */
export declare const Popper: React.FC<EnhancedPopperProps>;
export {};

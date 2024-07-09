import { TooltipProps } from '@mui/material';
import React from 'react';
/**
 * Create a Material UI Tooltip component
 *
 * @param {TooltipProps} props custom tooltip properties
 * @returns {JSX.Element} the tooltip ui component
 */
export declare const Tooltip: React.ForwardRefExoticComponent<Omit<TooltipProps, "ref"> & React.RefAttributes<unknown>>;

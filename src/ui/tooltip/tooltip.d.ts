/// <reference types="react" />
import { TooltipProps } from '@mui/material';
/**
 * Custom MUI Tooltip properties
 */
interface TypeTooltipProps extends TooltipProps {
    mapId?: string;
}
/**
 * Create a Material UI Tooltip component
 *
 * @param {TypeTooltipProps} props custom tooltip properties
 * @returns {JSX.Element} the tooltip ui component
 */
export declare function Tooltip(props: TypeTooltipProps): JSX.Element;
export {};

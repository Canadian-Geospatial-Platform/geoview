/// <reference types="react" />
import { TooltipProps, IconButtonProps } from '@mui/material';
/**
 * Properties for the icon button
 */
export interface TypeIconButtonProps extends IconButtonProps {
    children?: React.ReactNode;
    tooltip?: string;
    tooltipPlacement?: TooltipProps['placement'];
    id?: string;
    tabIndex?: number;
    iconRef?: React.RefObject<HTMLButtonElement>;
    visible?: boolean;
}

import { ReactNode, RefObject } from 'react';
import { TooltipProps, IconButtonProps } from '@mui/material';
/**
 * Properties for the icon button
 */
export interface TypeIconButtonProps extends IconButtonProps {
    children?: ReactNode;
    tooltip?: string;
    tooltipPlacement?: TooltipProps['placement'];
    tabIndex?: number;
    iconRef?: RefObject<HTMLButtonElement>;
    visible?: boolean;
}

import { TooltipProps, IconButtonProps } from '@mui/material';

/**
 * Properties for the icon button
 */
export interface TypeIconButtonProps extends IconButtonProps {
  children?: React.ReactNode;
  tooltip?: string;
  tooltipPlacement?: TooltipProps['placement'];
  tabIndex?: number;
  iconRef?: React.RefObject<HTMLButtonElement>;
  // button visibility
  visible?: boolean;
}

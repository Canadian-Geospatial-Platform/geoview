import React, { ReactNode } from 'react';
import { Grid } from '@/ui';
import { GridProps, useTheme } from '@mui/material';

interface DataTableGridProps extends GridProps {
  children: ReactNode;
}

interface DataTableGridPanelProps extends GridProps {
  children: ReactNode;
  isLayersPanelVisible: boolean;
}

/**
 * Create Grid Container
 * @param {ReactNode} children children to be renderer
 * @returns JSX.Element
 */
function DataTableGridRoot({ children, ...rest }: DataTableGridProps) {
  return (
    <Grid container {...rest}>
      {children}
    </Grid>
  );
}

/**
 * Create Left Panel for Data table grid.
 * @param {ReactNode} children child elements to be rendered
 * @param {boolean} isLayersPanelVisible panel visibility
 * @returns JSX.Element
 */
function DataTableGridLeftPanel({ children, isLayersPanelVisible = false, ...rest }: DataTableGridPanelProps) {
  const theme = useTheme();

  return (
    <Grid item sx={{ [theme.breakpoints.down('sm')]: { display: isLayersPanelVisible ? 'block' : 'none' } }} {...rest}>
      {children}
    </Grid>
  );
}

/**
 * Create Right Panel for Data table grid.
 * @param {ReactNode} children child elements to be rendered
 * @param {boolean} isLayersPanelVisible panel visibility
 * @returns JSX.Element
 */
function DataTableGridRightPanel({ children, isLayersPanelVisible = false, ...rest }: DataTableGridPanelProps) {
  const theme = useTheme();
  return (
    <Grid
      item
      sx={{
        paddingLeft: '1rem',
        position: 'relative',
        [theme.breakpoints.down('sm')]: { display: !isLayersPanelVisible ? 'block' : 'none', minHeight: '250px' },
      }}
      {...rest}
    >
      {children}
    </Grid>
  );
}

export const DataTableGrid = {
  Root: DataTableGridRoot,
  Left: DataTableGridLeftPanel,
  Right: DataTableGridRightPanel,
};

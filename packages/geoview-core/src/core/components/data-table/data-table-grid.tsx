import React, { ReactNode } from 'react';
import { GridProps, useTheme } from '@mui/material';
import { Grid } from '@/ui';

interface DataTableGridProps extends GridProps {
  children: ReactNode;
}

interface DataTableGridPanelProps extends GridProps {
  children: ReactNode;
  isLayersPanelVisible: boolean;
  isEnlargeDataTable: boolean;
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
function DataTableGridLeftPanel({ children, isLayersPanelVisible = false, isEnlargeDataTable = false, ...rest }: DataTableGridPanelProps) {
  const theme = useTheme();

  return (
    <Grid
      item
      sx={{
        [theme.breakpoints.down('md')]: { display: isLayersPanelVisible ? 'block !important' : 'none' },
        [theme.breakpoints.between('sm', 'md')]: { display: isEnlargeDataTable ? 'none' : 'block' },
      }}
      {...rest}
    >
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
        [theme.breakpoints.down('md')]: { display: !isLayersPanelVisible ? 'block' : 'none', minHeight: '250px' },
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

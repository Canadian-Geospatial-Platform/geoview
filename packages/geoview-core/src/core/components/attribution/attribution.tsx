import { useCallback, useState } from 'react';

import { useTheme } from '@mui/material/styles';

import { Box, MoreHorizIcon, Popover, IconButton, Typography } from '@/ui';
import { useUIMapInfoExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useMapAttribution } from '@/core/stores/store-interface-and-intial-values/map-state';
import { generateId } from '@/core/utils/utilities';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';

/**
 * Create an Attribution component that will display an attribution box
 * with the attribution text
 *
 * @returns {JSX.Element} created attribution element
 */
export function Attribution(): JSX.Element {
  // Log
  logger.logTraceRender('components/attribution/attribution');

  const theme = useTheme();

  const mapId = useGeoViewMapId();
  const mapElem = document.getElementById(`shell-${mapId}`);

  // internal state
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  // getStore value
  const mapAttribution = useMapAttribution();
  const expanded = useUIMapInfoExpanded();

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return (
    <>
      <IconButton
        id="attribution"
        onClick={handleOpenPopover}
        className={open ? 'active' : ''}
        tooltipPlacement="top"
        tooltip="mapctrl.attribution.tooltip"
        aria-label="mapctrl.attribution.tooltip"
        sx={{
          color: theme.palette.geoViewColor.bgColor.light[800],
          marginTop: expanded ? '0.75rem' : '0.25rem',
          [theme.breakpoints.up('md')]: {
            marginTop: expanded ? '1.4375rem' : 'none',
          },
          width: '30px',
          height: '30px',
          my: '1rem',
        }}
      >
        <MoreHorizIcon />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        container={mapElem}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        onClose={handleClosePopover}
      >
        <Box sx={{ padding: '1rem', width: '28.125rem' }}>
          {mapAttribution.map((attribution) => {
            return <Typography key={generateId()}>{attribution}</Typography>;
          })}
        </Box>
      </Popover>
    </>
  );
}

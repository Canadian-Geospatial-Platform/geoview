/* eslint-disable no-underscore-dangle */
import { useState } from 'react';

import { useTheme } from '@mui/material/styles';

import { Box, MoreHorizIcon, Popover, IconButton, Typography } from '@/ui';
import { useUIMapInfoExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useMapAttribution } from '@/core/stores/store-interface-and-intial-values/map-state';
import { generateId } from '@/core/utils/utilities';
import { useGeoViewMapId } from '@/app';
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

  const handleOpenPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  // get store value
  const expanded = useUIMapInfoExpanded();

  return (
    <>
      <IconButton
        id="attribution"
        onClick={handleOpenPopover}
        className={open ? 'active' : ''}
        tooltipPlacement="top"
        tooltip="mapctrl.attribution.tooltip"
        sx={{
          color: theme.palette.geoViewColor.bgColor.light[800],
          marginTop: expanded ? '12px' : '4px',
          [theme.breakpoints.up('md')]: {
            marginTop: expanded ? '23px' : 'none',
          },
          width: '30px',
          height: '30px',
        }}
        aria-label="mapctrl.attribution.tooltip"
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
          horizontal: 'left',
        }}
        onClose={handleClosePopover}
      >
        <Box sx={{ padding: '15px', width: '450px' }}>
          {mapAttribution.map((attribution) => {
            return <Typography key={generateId()}>{attribution}</Typography>;
          })}
        </Box>
      </Popover>
    </>
  );
}

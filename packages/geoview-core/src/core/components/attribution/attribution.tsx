/* eslint-disable no-underscore-dangle */
import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { Box, MoreHorizIcon, Popover, IconButton, Typography } from '@/ui';
import { useUIFooterBarExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useMapAttribution } from '@/core/stores/store-interface-and-intial-values/map-state';
import { generateId } from '@/core/utils/utilities';

/**
 * Create an Attribution component that will display an attribution box
 * with the attribution text
 *
 * @returns {JSX.Element} created attribution element
 */
export function Attribution(): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();

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
  const expanded = useUIFooterBarExpanded();

  return (
    <>
      <IconButton
        id="attribution"
        onClick={handleOpenPopover}
        className={open ? 'active' : ''}
        tooltipPlacement="top"
        tooltip={t('mapctrl.attribution.tooltip')!}
        sx={{
          color: 'primary.light',
          marginTop: expanded ? '12px' : '4px',
          [theme.breakpoints.up('md')]: {
            marginTop: expanded ? '23px' : 'none',
          },
          width: '30px',
          height: '30px',
        }}
      >
        <MoreHorizIcon />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
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
        <Box sx={{ padding: '15px' }}>
          {mapAttribution.map((attribution) => {
            return <Typography key={generateId()}>{attribution}</Typography>;
          })}
        </Box>
      </Popover>
    </>
  );
}

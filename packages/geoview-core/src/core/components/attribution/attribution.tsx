/* eslint-disable no-underscore-dangle */
import { useContext, useEffect, useState } from 'react';

import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

import { MapContext } from '@/core/app-start';
import { Tooltip, Box, MoreHorizIcon, Popover, IconButton } from '@/ui';
import { getSxClasses } from './attribution-style';
import { useUIFooterBarExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';

/**
 * Create an Attribution component that will display an attribution box
 * with the attribution text
 *
 * @returns {JSX.Element} created attribution element
 */
export function Attribution(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const deviceSizeMedUp = useMediaQuery(theme.breakpoints.up('md'));

  // internal state
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const open = Boolean(anchorEl);

  const handleOpenPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  // internal component state
  const [attribution, setAttribution] = useState('');

  // get store value
  const expanded = useUIFooterBarExpanded();

  // close the popover attribution when page size is medium or larger if popover is open
  useEffect(() => {
    if (deviceSizeMedUp && open) {
      handleClosePopover();
    }
  }, [deviceSizeMedUp, open]);

  useEffect(() => {
    const attributionTextElement = document.getElementById(`${mapId}-attribution-text`) as HTMLElement;

    // TODO: put attribution in store from add layer events
    const tooltipAttribution = [];
    if (attributionTextElement) {
      const liElements = attributionTextElement.getElementsByTagName('LI');
      if (liElements && liElements.length > 0) {
        for (let liElementIndex = 0; liElementIndex < liElements.length; liElementIndex++) {
          const liElement = liElements[liElementIndex] as HTMLElement;
          tooltipAttribution.push(liElement.innerText);
        }
      }
    }

    setAttribution(tooltipAttribution.join('\n'));
  }, [mapId, open]);

  return (
    <>
      <IconButton
        id="attribution"
        onClick={handleOpenPopover}
        className={open ? 'active' : ''}
        sx={{
          [theme.breakpoints.up('md')]: {
            display: 'none',
          },
          color: 'primary.light',
          marginTop: expanded ? '12px' : '4px',
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
        <Box
          sx={{
            [theme.breakpoints.up('md')]: {
              display: 'none',
            },
            p: '15px',
            width: '300px',
          }}
        >
          {attribution}
        </Box>
      </Popover>
      <Tooltip
        title={attribution}
        sx={{
          [theme.breakpoints.up('md')]: {
            display: 'none',
          },
        }}
      >
        <Box
          onKeyDown={(evt) => {
            if (evt.code === 'Space') {
              evt.preventDefault(); // prevent space keydown to scroll the page
              evt.stopPropagation();
            }
          }}
          id={`${mapId}-attribution-text`}
          sx={[sxClasses.attributionContainer, { visibility: expanded ? 'visible' : 'hidden' }]}
          tabIndex={0}
        />
      </Tooltip>
    </>
  );
}

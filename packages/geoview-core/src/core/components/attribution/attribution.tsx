/* eslint-disable no-underscore-dangle */
import { useContext, useEffect, useState } from 'react';

import { useTheme } from '@mui/material/styles';

import { MapContext } from '@/core/app-start';
import { Box, MoreHorizIcon, Popover, IconButton } from '@/ui';
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
  // TODO for now keep the sxClasses, need to make sure we don't need any of those styles when we add back the attribution
  // TODO if we don't need any of styles, please remove the style file and remove line below
  const sxClasses = getSxClasses(theme);

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
        <Box
          sx={{
            p: '15px',
            width: '300px',
          }}
        >
          Attribution content
        </Box>
      </Popover>
    </>
  );
}

import { useState, MouseEvent } from 'react';
import { useTheme } from '@mui/material/styles';
import { getSxClasses } from './nav-bar-style';
import { Box, Popover, IconButton, DialogTitle, DialogContent, Typography } from '@/ui';
import { useAppFullscreenActive, useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { TypeButtonPanel } from '@/ui/panel/panel-types';

interface NavbarPanelButtonType {
  buttonPanel: TypeButtonPanel;
}

/**
 * Navbar modal component
 *
 * @returns {JSX.Element} the export modal component
 */
export default function NavbarPanelButton({ buttonPanel }: NavbarPanelButtonType): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const mapId = useGeoViewMapId();
  const geoviewElement = useAppGeoviewHTMLElement();
  const isMapFullScreen = useAppFullscreenActive();

  const shellContainer = geoviewElement.querySelector(`[id^="shell-${mapId}"]`) as HTMLElement;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const id = open ? 'simple-popover' : undefined;

  const handleClick = (event: MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        key={buttonPanel.button.id}
        id={buttonPanel.button.id}
        tooltip={buttonPanel.button.tooltip}
        tooltipPlacement={buttonPanel.button.tooltipPlacement}
        sx={sxClasses.navButton}
        onClick={(e) => handleClick(e)}
      >
        {buttonPanel.button.children}
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        onClose={handleClose}
        // popover will be displayed when screen is in fullscreen mode.
        {...(isMapFullScreen && { container: shellContainer })}
      >
        <Box sx={{ width: `${buttonPanel.panel?.width ?? 300}px`, maxHeight: '500px', marginRight: '10px' }}>
          <DialogTitle>{(buttonPanel.panel?.title as string) ?? ''}</DialogTitle>
          <DialogContent dividers>
            <Typography dangerouslySetInnerHTML={{ __html: buttonPanel?.panel?.content ?? '' }} />
          </DialogContent>
        </Box>
      </Popover>
    </>
  );
}

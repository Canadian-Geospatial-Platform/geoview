/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, MouseEvent } from 'react';
import { useTheme } from '@mui/material/styles';
import { getSxClasses } from './nav-bar-style';
import { Box, Popover, IconButton, DialogTitle, DialogContent } from '@/ui';
import { useAppFullscreenActive, useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { TypeButtonPanel } from '@/ui/panel/panel-types';
import { logger } from '@/core/utils/logger';
import { HtmlToReact } from '@/core/containers/html-to-react';

interface NavbarPanelButtonType {
  buttonPanel: TypeButtonPanel;
}

/**
 * Navbar popover component
 *
 * @returns {JSX.Element} the export popover component
 */
export default function NavbarPanelButton({ buttonPanel }: NavbarPanelButtonType): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/nav-bar-panel-button');

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
        className={open ? 'highlighted' : ''}
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
        sx={{
          '& .MuiPopover-paper': {
            transform: 'translateX(-8px) !important', // Adjust the value for desired spacing
          },
        }}
      >
        <Box sx={{ width: `${buttonPanel.panel?.width ?? 300}px`, maxHeight: '500px' }}>
          <DialogTitle sx={sxClasses.popoverTitle}>{(buttonPanel.panel?.title as string) ?? ''}</DialogTitle>
          <DialogContent dividers>
            <HtmlToReact htmlContent={(buttonPanel?.panel?.content ?? '') as any} />
          </DialogContent>
        </Box>
      </Popover>
    </>
  );
}

import { useState } from 'react';
import { ClickAwayListener } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getSxClasses } from './nav-bar-style';
import { Popper, IconButton, DialogTitle, DialogContent, Paper, Box } from '@/ui';
import { useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
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

  const shellContainer = geoviewElement.querySelector(`[id^="shell-${mapId}"]`) as HTMLElement;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (open) {
      setOpen(false);
      setAnchorEl(null);
    } else {
      setAnchorEl(event.currentTarget);
      setOpen(true);
    }
  };

  const handleClickAway = (): void => {
    if (open) {
      setOpen(false);
      setAnchorEl(null);
    }
  };

  return (
    <ClickAwayListener key={buttonPanel.button.id} mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box>
        <IconButton
          key={buttonPanel.button.id}
          id={buttonPanel.button.id}
          tooltip={buttonPanel.button.tooltip}
          tooltipPlacement={buttonPanel.button.tooltipPlacement}
          sx={sxClasses.navButton}
          onClick={(e) => handleClick(e)}
          className={open ? 'highlighted active' : ''}
        >
          {buttonPanel.button.children}
        </IconButton>

        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="left-end"
          onClose={handleClickAway}
          container={shellContainer}
          sx={{
            '& .MuiPopover-paper': {
              transform: 'translateX(-8px) !important', // Adjust the value for desired spacing
            },
          }}
        >
          <Paper sx={{ width: `${buttonPanel.panel?.width ?? 300}px`, maxHeight: '500px' }}>
            <DialogTitle sx={sxClasses.popoverTitle}>{(buttonPanel.panel?.title as string) ?? ''}</DialogTitle>
            <DialogContent>
              {buttonPanel.panel?.convertHtmlContent ? (
                <HtmlToReact htmlContent={buttonPanel.panel?.content as string} />
              ) : (
                buttonPanel.panel?.content
              )}
            </DialogContent>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}

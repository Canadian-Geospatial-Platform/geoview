import { useState } from 'react';
import { ClickAwayListener } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { getSxClasses } from './nav-bar-style';
import { Popper, IconButton, DialogTitle, DialogContent, Paper, Box } from '@/ui';
import { useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { TypeButtonPanel } from '@/ui/panel/panel-types';
import { logger } from '@/core/utils/logger';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { handleEscapeKey } from '@/core/utils/utilities';

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

  const { t } = useTranslation<string>();

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
          tooltip={t(buttonPanel.button.tooltip!) as string}
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
          sx={{ marginRight: '5px !important' }}
          handleKeyDown={(key, callBackFn) => handleEscapeKey(key, '', false, callBackFn)}
        >
          <Paper sx={{ width: `${buttonPanel.panel?.width ?? 300}px`, maxHeight: '500px' }}>
            <DialogTitle sx={sxClasses.popoverTitle}>{t(buttonPanel.panel?.title as string) ?? ''}</DialogTitle>
            <DialogContent>
              {buttonPanel.panel?.convertHtmlContent ? (
                <UseHtmlToReact htmlContent={buttonPanel.panel?.content as string} />
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

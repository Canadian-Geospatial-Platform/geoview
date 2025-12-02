import { useMemo, useState, cloneElement, isValidElement } from 'react';
import { ClickAwayListener } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { getSxClasses } from './nav-bar-style';
import { Popper, IconButton, DialogTitle, DialogContent, Paper, Box } from '@/ui';
import { CloseIcon } from '@/ui/icons';
import { useAppShellContainer } from '@/core/stores/store-interface-and-intial-values/app-state';
import type { TypeButtonPanel } from '@/ui/panel/panel-types';
import { logger } from '@/core/utils/logger';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { handleEscapeKey } from '@/core/utils/utilities';
import { useUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';

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

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const shellContainer = useAppShellContainer();

  // States
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  // Close function to pass to panel content
  const closePanel = (): void => {
    setOpen(false);
    setAnchorEl(null);
  };

  // Handlers
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (open) {
      closePanel();
    } else {
      setAnchorEl(event.currentTarget);
      setOpen(true);
    }
  };

  const handleClickAway = (): void => {
    if (open) {
      closePanel();
    }
  };

  // Clone panel content and inject close function if it's a React element
  const renderPanelContent = (): JSX.Element => {
    if (buttonPanel.panel?.convertHtmlContent) {
      return <UseHtmlToReact htmlContent={buttonPanel.panel?.content as string} />;
    }

    if (isValidElement(buttonPanel.panel?.content)) {
      return cloneElement(buttonPanel.panel.content as React.ReactElement, { closePanel });
    }

    return buttonPanel.panel?.content as JSX.Element;
  };

  return (
    <ClickAwayListener key={buttonPanel.button.id} mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box>
        <IconButton
          key={buttonPanel.button.id}
          id={buttonPanel.button.id}
          aria-label={buttonPanel.button['aria-label']}
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
          focusSelector="button"
          focusTrap={activeTrapGeoView}
          sx={{ marginRight: '5px !important' }}
          handleKeyDown={(key, callBackFn) => handleEscapeKey(key, '', false, callBackFn)}
        >
          <Paper sx={{ width: `${buttonPanel.panel?.width ?? 300}px`, maxHeight: '500px' }}>
            <DialogTitle sx={sxClasses.popoverTitle}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                {t(buttonPanel.panel?.title as string) ?? ''}
                <IconButton
                  size="small"
                  aria-label={t('general.close')}
                  onClick={closePanel}
                  sx={{ padding: 0.5, color: 'inherit', position: 'relative', left: '16px' }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </span>
            </DialogTitle>
            <DialogContent>{renderPanelContent()}</DialogContent>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}

import { useMemo, useState, cloneElement, isValidElement, useId } from 'react';

import { useTranslation } from 'react-i18next';

import { ClickAwayListener } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from './nav-bar-style';
import { Popper, IconButton, DialogTitle, DialogContent, Paper, Box } from '@/ui';
import { CloseIcon } from '@/ui/icons';
import { useStoreAppShellContainer } from '@/core/stores/states/app-state';
import type { TypeButtonPanel } from '@/ui/panel/panel-types';
import { logger } from '@/core/utils/logger';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { handleEscapeKey } from '@/core/utils/utilities';
import { useStoreUIActiveTrapGeoView } from '@/core/stores/states/ui-state';
import type { SxStyles } from '@/ui/style/types';

/**
 * Translates an optional tooltip value.
 *
 * @param t - Translation function
 * @param tooltip - Tooltip value (translation key, null to disable, or undefined for fallback)
 * @returns Translated string, null (disabled), or undefined (fallback to aria-label)
 */
function translateTooltip(t: (key: string) => string, tooltip: string | null | undefined): string | null | undefined {
  if (tooltip === null) return null;
  if (tooltip !== undefined) return t(tooltip);
  return undefined;
}

/** The properties for the navbar panel button. */
interface NavbarPanelButtonType {
  /** The button panel configuration. */
  buttonPanel: TypeButtonPanel;
  /** Whether the button is in an active state. */
  isActive?: boolean;
}

/**
 * Creates a navbar button with a popover panel.
 *
 * @param props - The navbar panel button properties
 * @returns The navbar panel button component
 */
export default function NavbarPanelButton({ buttonPanel, isActive = false }: NavbarPanelButtonType): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/nav-bar-panel-button');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const baseId = useId();
  const dialogTitleId = `${baseId}-title`;

  // Store
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();
  const shellContainer = useStoreAppShellContainer();

  // Extract panel width if provided
  const panelWidth = buttonPanel.panel?.width;

  /**
   * Builds custom sx classes for the navbar panel button.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    // Log
    logger.logTraceUseMemo('NAV-BAR-PANEL-BUTTON - memoSxClasses', theme, panelWidth);

    return getSxClasses(theme, panelWidth);
  }, [theme, panelWidth]);

  // States
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  // #region Handlers

  /**
   * Closes the panel and clears the anchor element.
   */
  const closePanel = (): void => {
    setOpen(false);
    setAnchorEl(null);
  };

  /**
   * Handles when the user clicks the navbar button to toggle the panel.
   */
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (open) {
      closePanel();
    } else {
      setAnchorEl(event.currentTarget);
      setOpen(true);
    }
  };

  /**
   * Handles when the user clicks away from the popover.
   */
  const handleClickAway = (): void => {
    if (open) {
      closePanel();
    }
  };

  // #endregion Handlers

  /**
   * Renders the panel content based on the button panel configuration.
   *
   * @returns The rendered panel content
   */
  const renderPanelContent = (): JSX.Element => {
    if (buttonPanel.panel?.convertHtmlContent) {
      return <UseHtmlToReact htmlContent={buttonPanel.panel?.content as string} />;
    }

    if (isValidElement(buttonPanel.panel?.content)) {
      return cloneElement(buttonPanel.panel.content as React.ReactElement<{ closePanel?: () => void }>, { closePanel });
    }

    return buttonPanel.panel?.content as JSX.Element;
  };

  return (
    <ClickAwayListener key={buttonPanel.button.id} mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box>
        <IconButton
          key={buttonPanel.button.id}
          id={buttonPanel.button.id}
          aria-label={t(buttonPanel.button['aria-label'])}
          aria-expanded={open}
          aria-haspopup="dialog"
          tooltip={translateTooltip(t, buttonPanel.button.tooltip)}
          tooltipPlacement={buttonPanel.button.tooltipPlacement}
          sx={memoSxClasses.navButton}
          onClick={handleClick}
          className={open || isActive ? 'highlighted active' : ''}
        >
          {buttonPanel.button.children}
        </IconButton>

        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="left-end"
          modifiers={[
            {
              name: 'preventOverflow',
              enabled: true,
              options: {
                boundary: 'viewport',
                padding: 8,
              },
            },
          ]}
          onClose={handleClickAway}
          container={shellContainer}
          focusSelector="button"
          role="dialog"
          aria-labelledby={dialogTitleId}
          focusTrap={activeTrapGeoView}
          sx={memoSxClasses.popper}
          handleKeyDown={handleEscapeKey}
        >
          <Paper sx={memoSxClasses.popoverPaper}>
            <Box sx={memoSxClasses.popoverTitleContainer}>
              <DialogTitle id={dialogTitleId} sx={memoSxClasses.popoverTitleLabel}>
                {t(buttonPanel.panel?.title as string) ?? ''}
              </DialogTitle>
              <Box sx={memoSxClasses.popoverTitleActions}>
                <IconButton className="buttonPopperClose" size="small" aria-label={t('general.close')} onClick={closePanel} color="inherit">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <DialogContent sx={memoSxClasses.popoverContent}>{renderPanelContent()}</DialogContent>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}

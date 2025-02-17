import { useRef, useEffect, KeyboardEvent, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import { useTheme } from '@mui/material/styles';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';

import { Box } from '@/ui/layout/index';
import { TypePanelProps } from '@/ui/panel/panel-types';
import { CloseIcon } from '@/ui/icons/index';
import { IconButton, TypeIconButtonProps } from '@/ui/icon-button/icon-button';
import { getSxClasses } from '@/ui/panel/panel-style';
import { useMapSize } from '@/core/stores/store-interface-and-intial-values/map-state';
import { CV_DEFAULT_APPBAR_CORE } from '@/api/config/types/config-constants';
import { FocusTrapContainer } from '@/core/components/common';
import { logger } from '@/core/utils/logger';

/**
 * Interface for panel properties
 */
export type TypePanelAppProps = {
  panel: TypePanelProps;
  button: TypeIconButtonProps;

  // Callback when the user clicked the general close button
  handleGeneralClose?: () => void;
  // Callback when the panel has completed opened (and transitioned in)
  handleOpen?: () => void;
  // Callback when the panel has been closed
  handleClose?: () => void;
  // Callback when the panel has been closed by escape key
  handleKeyDown?: (event: KeyboardEvent) => void;
};

/**
 * Create a panel with a header title, icon and content
 * @param {TypePanelAppProps} props panel properties
 *
 * @returns {JSX.Element} the created Panel element
 */
export const Panel = memo(function Panel(props: TypePanelAppProps): JSX.Element {
  logger.logTraceRender('ui/panel/panel');

  // Get constant from props
  const { panel, button, handleOpen, handleClose, handleGeneralClose, handleKeyDown, ...rest } = props;
  const { status: open = false, isFocusTrapped = false, panelStyles, panelGroupName } = panel;

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // TODO: should the mapSize pass as props to remove link with store
  // Store
  const mapSize = useMapSize();

  // State
  const panelContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLButtonElement>(null);
  const panelHeader = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelWidth = panel?.width ?? 400;

  // TODO: style - manage style in the sx classes, regroup height and width management
  const panelContainerStyles = {
    ...(panelStyles?.panelContainer && { ...panelStyles.panelContainer }),
    width: open ? panelWidth : 0,
    height: `calc(100%  - 3rem)`,
    maxWidth: panel?.width ?? 400,
    [theme.breakpoints.down('sm')]: {
      width: 'calc(100% - 64px)',
      maxWidth: 'calc(100% - 64px)',
    },
    transition: `${theme.transitions.duration.standard}ms ease`,
    position: 'absolute',
    left: '64px',
  };

  useEffect(() => {
    logger.logTraceUseEffect('UI.PANEL - open');

    if (open) {
      // set focus on close button on panel open
      if (closeBtnRef && closeBtnRef.current) {
        (closeBtnRef.current as HTMLElement).focus();
      }

      // Wait the transition period (+50 ms just to be sure of shenanigans)
      setTimeout(() => {
        handleOpen?.();
      }, theme.transitions.duration.standard + 50);
    } else {
      // Wait the transition period (+50 ms just to be sure of shenanigans)
      setTimeout(() => {
        handleClose?.();
      }, theme.transitions.duration.standard + 50);
    }
  }, [open, theme.transitions.duration.standard, handleOpen, handleClose]);

  /**
   * Update the width of data table and layers panel when window is resize based on mapsize
   */
  useEffect(() => {
    logger.logTraceUseEffect('UI.PANEL - update width');

    // TODO: style - panel type or even width should be pass as props to remove dependency
    if (
      (panelGroupName === CV_DEFAULT_APPBAR_CORE.DATA_TABLE || panelGroupName === CV_DEFAULT_APPBAR_CORE.LAYERS) &&
      panelContainerRef.current &&
      open
    ) {
      panelContainerRef.current.style.width = `${mapSize[0]}px`;
      panelContainerRef.current.style.maxWidth = `${mapSize[0]}px`;
    } else {
      panelContainerRef.current?.removeAttribute('style');
    }
  }, [mapSize, panelGroupName, open]);

  return (
    <Box sx={panelContainerStyles} ref={panelContainerRef}>
      <FocusTrapContainer open={isFocusTrapped} id="app-bar-focus-trap">
        <Card
          sx={{
            ...sxClasses.panelContainer,
            display: open ? 'block' : 'none',
            ...(panelStyles?.panelCard && { ...panelStyles.panelCard }),
          }}
          ref={panelRef as React.MutableRefObject<null>}
          onKeyDown={(event: KeyboardEvent) => handleKeyDown?.(event)}
          {...{ 'data-id': button.id }}
          {...rest}
        >
          <CardHeader
            sx={panelStyles?.panelCardHeader ? { ...panelStyles.panelCardHeader } : {}}
            ref={panelHeader}
            title={t(panel.title as string)}
            titleTypographyProps={{
              component: 'h2',
            }}
            action={
              open ? (
                <IconButton
                  tooltip={t('general.close')!}
                  tooltipPlacement="right"
                  aria-label={t('general.close')!}
                  size="small"
                  onClick={() => handleGeneralClose?.()}
                  iconRef={closeBtnRef}
                  className="cgpv-panel-close"
                >
                  <CloseIcon />
                </IconButton>
              ) : (
                ''
              )
            }
          />

          <CardContent sx={{ ...sxClasses.panelContentContainer, ...(panelStyles ? panelStyles.panelCardContent : {}) }}>
            {typeof panel.content === 'string' ? <UseHtmlToReact htmlContent={panel.content} /> : panel.content}
          </CardContent>
        </Card>
      </FocusTrapContainer>
    </Box>
  );
});

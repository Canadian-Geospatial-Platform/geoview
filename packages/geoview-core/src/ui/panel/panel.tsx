import { useRef, useEffect, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import FocusTrap from 'focus-trap-react';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import { useTheme } from '@mui/material/styles';
import { HtmlToReact } from '@/core/containers/html-to-react';
import { IconButton, CloseIcon, Box, TypePanelProps } from '..';
import { logger } from '@/core/utils/logger';

import { TypeIconButtonProps } from '@/ui/icon-button/icon-button-types';
import { getSxClasses } from './panel-style';
import { useUIActiveTrapGeoView, useUIMapInfoExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useMapSize } from '@/core/stores/store-interface-and-intial-values/map-state';
import { CV_DEFAULT_APPBAR_CORE } from '@/api/config/types/config-constants';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

/**
 * Interface for panel properties
 */
export type TypePanelAppProps = {
  panel: TypePanelProps;
  button: TypeIconButtonProps;

  // Callback when the user clicked the general close button
  onGeneralCloseClicked?: () => void;
  // Callback when the panel has completed opened (and transitioned in)
  onPanelOpened?: () => void;
  // Callback when the panel has been closed
  onPanelClosed?: () => void;
};

/**
 * Create a panel with a header title, icon and content
 * @param {TypePanelAppProps} props panel properties
 *
 * @returns {JSX.Element} the created Panel element
 */
export function Panel(props: TypePanelAppProps): JSX.Element {
  const { panel, button, onPanelOpened, onPanelClosed, onGeneralCloseClicked } = props;
  const { status: open = false, panelStyles, panelGroupName } = panel;

  const { t } = useTranslation<string>();

  // Get the theme
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const mapId = useGeoViewMapId();
  const mapSize = useMapSize();
  const mapInfoExpanded = useUIMapInfoExpanded();

  // internal state
  // set the active trap value for FocusTrap
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const panelContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLButtonElement>(null);
  const panelHeader = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelWidth = panel?.width ?? 400;
  const panelContainerStyles = {
    ...(panelStyles?.panelContainer && { ...panelStyles.panelContainer }),
    width: open ? panelWidth : 0,
    maxWidth: panel?.width ?? 400,
    [theme.breakpoints.down('sm')]: {
      width: 'calc(100% - 64px)',
      maxWidth: 'calc(100% - 64px)',
    },
    transition: `width ${theme.transitions.duration.standard}ms ease`,
    position: 'absolute',
    left: '64px',
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('UI.PANEL - open');

    if (open) {
      // set focus on close button on panel open
      if (closeBtnRef && closeBtnRef.current) {
        (closeBtnRef.current as HTMLElement).focus();
      }

      // Wait the transition period (+50 ms just to be sure of shenanigans)
      setTimeout(() => {
        onPanelOpened?.();
      }, theme.transitions.duration.standard + 50);
    } else {
      // Wait the transition period (+50 ms just to be sure of shenanigans)
      setTimeout(() => {
        onPanelClosed?.();
      }, theme.transitions.duration.standard + 50);
    }
  }, [open, theme.transitions.duration.standard, onPanelOpened, onPanelClosed]);

  /**
   * Update the width of data table and layers panel when window is resize based on mapsize
   */
  useEffect(() => {
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

  /**
   * Update the height of the panel when the mapInfo is expanded
   */
  useEffect(() => {
    const mapInfo = document.getElementById(`${mapId}-mapInfo`);
    if (panelContainerRef.current && open && mapInfo) {
      const mapInfoHeight = mapInfo.getBoundingClientRect().height;
      panelContainerRef.current.style.height = `calc(100%  - ${mapInfoHeight}px)`;
    }
  }, [mapInfoExpanded, mapSize, open, mapId]);

  // TODO: refactor - remove comment in tsx for production build facebook/create-react-app#9507
  return (
    <Box sx={panelContainerStyles} ref={panelContainerRef}>
      <FocusTrap
        active={activeTrapGeoView && open}
        focusTrapOptions={{
          escapeDeactivates: false,
          clickOutsideDeactivates: true,
        }}
      >
        <Card
          sx={{
            ...sxClasses.panelContainer,
            display: open ? 'block' : 'none',
            ...(panelStyles?.panelCard && { ...panelStyles.panelCard }),
          }}
          ref={panelRef as React.MutableRefObject<null>}
          onKeyDown={(e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              onGeneralCloseClicked?.();
            }
          }}
          {...{ 'data-id': button.id }}
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
                  onClick={() => onGeneralCloseClicked?.()}
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
            {typeof panel.content === 'string' ? <HtmlToReact htmlContent={panel.content} /> : panel.content}
          </CardContent>
        </Card>
      </FocusTrap>
    </Box>
  );
}

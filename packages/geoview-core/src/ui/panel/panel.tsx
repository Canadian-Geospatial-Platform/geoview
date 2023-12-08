/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable no-nested-ternary */
import { useRef, useState, useEffect, useCallback, ReactNode, KeyboardEvent } from 'react';

import { useTranslation } from 'react-i18next';

import FocusTrap from 'focus-trap-react';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import { useTheme } from '@mui/material/styles';

import { Cast } from '@/core/types/global-types';
import { HtmlToReact } from '@/core/containers/html-to-react';

import { api, useGeoViewMapId } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { IconButton, CloseIcon, PanelApi, Box } from '..';
import {
  payloadIsAPanelAction,
  payloadIsAPanelContent,
  payloadHasAButtonIdAndType,
  inKeyfocusPayload,
  PayloadBaseClass,
} from '@/api/events/payloads';
import { TypeIconButtonProps } from '../icon-button/icon-button-types';
import { getSxClasses } from './panel-style';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

/**
 * Interface for panel properties
 */
type TypePanelAppProps = {
  panel: PanelApi;
  //   panelOpen: boolean;
  button: TypeIconButtonProps;

  // Callback when the panel has completed opened (and transitioned in)
  handlePanelOpened?: () => void;
};

/**
 * Create a panel with a header title, icon and content
 * @param {TypePanelAppProps} props panel properties
 *
 * @returns {JSX.Element} the created Panel element
 */
export function Panel(props: TypePanelAppProps): JSX.Element {
  const { panel, button, handlePanelOpened } = props;
  const { panelStyles } = panel;

  const mapId = useGeoViewMapId();

  const { t } = useTranslation<string>();

  // Get the theme
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  // set the active trap value for FocusTrap
  const [panelStatus, setPanelStatus] = useState(false);
  const [actionButtons, setActionButtons] = useState<JSX.Element[] & ReactNode[]>([]);
  const [, updatePanelContent] = useState(0);
  const panelRef = useRef<HTMLButtonElement>(null);
  const panelHeader = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelWidth = panel?.width ?? 350;
  const panelContainerStyles = {
    ...(panelStyles?.panelContainer && { ...panelStyles.panelContainer }),
    width: panelStatus ? panelWidth : 0,
    transition: `width ${theme.transitions.duration.standard}ms ease`,
  };

  // get store values and actions
  const { hideClickMarker } = useMapStoreActions();

  /**
   * function that causes rerender when changing panel content
   */
  const updateComponent = useCallback(() => {
    updatePanelContent((count) => count + 1);
  }, []);

  /**
   * Close the panel
   */
  const closePanel = (): void => {
    // emit an event to hide the marker when using the details panel
    hideClickMarker();

    const buttonElement = document.getElementById(mapId)?.querySelector(`#${button.id}`);

    if (buttonElement) {
      // put back focus on calling button
      document.getElementById(button.id!)?.focus();
    } else {
      const mapCont = api.maps[mapId].map.getTargetElement();
      mapCont.focus();

      // if in focus trap mode, trigger the event
      if (mapCont.closest('.llwp-map')?.classList.contains('map-focus-trap')) {
        mapCont.classList.add('keyboard-focus');
        api.event.emit(inKeyfocusPayload(EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, `map-${mapId}`));
      }
    }

    setPanelStatus(false);
  };

  const panelChangeContentListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAPanelContent(payload)) {
      // set focus on close button on panel content change
      setTimeout(() => {
        if (closeBtnRef && closeBtnRef.current) (closeBtnRef.current as HTMLElement).focus();
      }, 100);

      if (payload.buttonId === button.id!) {
        updateComponent();
      }
    }
  };

  // listen to change panel content and rerender right after the panel has been created
  api.event.on(EVENT_NAMES.PANEL.EVENT_PANEL_CHANGE_CONTENT, panelChangeContentListenerFunction, `${mapId}/${button.id!}`);

  const openPanelListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadHasAButtonIdAndType(payload)) {
      // set focus on close button on panel open
      setPanelStatus(true);

      if (handlePanelOpened) {
        // Wait the transition period (+50 ms just to be sure of shenanigans)
        setTimeout(() => {
          handlePanelOpened!();
        }, theme.transitions.duration.standard + 50);
      }

      if (closeBtnRef && closeBtnRef.current) {
        (closeBtnRef.current as HTMLElement).focus();
      }
    }
  };

  const closePanelListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadHasAButtonIdAndType(payload)) closePanel();
  };

  const closeAllPanelListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadHasAButtonIdAndType(payload)) setPanelStatus(false);
  };

  const panelAddActionListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAPanelAction(payload)) {
      if (payload.buttonId === button.id!) {
        const { actionButton } = payload;

        setActionButtons((prev) => [
          ...prev,
          <IconButton
            key={actionButton.actionButtonId}
            tooltip={actionButton.title}
            tooltipPlacement="right"
            id={actionButton.actionButtonId}
            aria-label={actionButton.title}
            onClick={Cast<React.MouseEventHandler>(actionButton.action)}
            size="small"
          >
            {typeof actionButton.children === 'string' ? (
              <HtmlToReact
                style={{
                  display: 'flex',
                }}
                htmlContent={actionButton.children}
              />
            ) : (
              (actionButton.children as ReactNode)
            )}
          </IconButton>,
        ]);
      }
    }
  };

  const panelRemoveActionListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAPanelAction(payload)) {
      if (payload.buttonId === button.id!) {
        setActionButtons((list) =>
          list.filter((item) => {
            return item.props.id !== payload.actionButton.actionButtonId;
          })
        );
      }
    }
  };

  useEffect(() => {
    // if the panel was still open on reload then close it
    if (panel.status) {
      panel.closeAll();
      setPanelStatus(true);
    }

    // listen to open panel to activate focus trap and focus on close
    api.event.on(EVENT_NAMES.PANEL.EVENT_PANEL_OPEN, openPanelListenerFunction, `${mapId}/${button.id!}`);

    // listen to panel close
    api.event.on(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE, closePanelListenerFunction, `${mapId}/${button.id!}`);

    // listen to close all panels
    api.event.on(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE_ALL, closeAllPanelListenerFunction, `${mapId}/${button.id!}`);

    // listen to add action button event
    api.event.on(EVENT_NAMES.PANEL.EVENT_PANEL_ADD_ACTION, panelAddActionListenerFunction, `${mapId}/${button.id!}`);

    // listen to remove action button event
    api.event.on(EVENT_NAMES.PANEL.EVENT_PANEL_REMOVE_ACTION, panelRemoveActionListenerFunction, `${mapId}/${button.id!}`);

    return () => {
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_OPEN, `${mapId}/${button.id!}`, openPanelListenerFunction);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE, `${mapId}/${button.id!}`, closePanelListenerFunction);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE_ALL, `${mapId}/${button.id!}`, closeAllPanelListenerFunction);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_ADD_ACTION, `${mapId}/${button.id!}`, panelAddActionListenerFunction);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_REMOVE_ACTION, `${mapId}/${button.id!}`, panelRemoveActionListenerFunction);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_CHANGE_CONTENT, `${mapId}/${button.id!}`, panelChangeContentListenerFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // set focus on close button on panel open
    if (closeBtnRef && closeBtnRef.current) if (button.visible) Cast<HTMLElement>(closeBtnRef.current).focus();
  }, [button, closeBtnRef]);

  return (
    <Box sx={panelContainerStyles}>
      <FocusTrap
        active={panelStatus}
        focusTrapOptions={{
          escapeDeactivates: false,
          clickOutsideDeactivates: true,
        }}
      >
        <Card
          sx={{
            ...sxClasses.panelContainer,
            display: panelStatus ? 'block' : 'none',
            ...(panelStyles?.panelCard && { ...panelStyles.panelCard }),
          }}
          ref={panelRef as React.MutableRefObject<null>}
          onKeyDown={(e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              panel.close();
            }
          }}
          {...{ 'data-id': button.id }}
        >
          <CardHeader
            sx={panelStyles?.panelCardHeader ? { ...panelStyles.panelCardHeader } : {}}
            ref={panelHeader}
            title={t(panel.title)}
            titleTypographyProps={{
              component: 'h2',
            }}
            action={
              panelStatus ? (
                <>
                  {actionButtons}
                  <IconButton
                    tooltip={t('general.close')!}
                    tooltipPlacement="right"
                    aria-label={t('general.close')!}
                    size="small"
                    onClick={panel.close}
                    iconRef={closeBtnRef}
                    className="cgpv-panel-close"
                  >
                    <CloseIcon />
                  </IconButton>
                </>
              ) : (
                <></>
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

/**
 * React's default properties for the Panel
 */
Panel.defaultProps = {
  handlePanelOpened: null,
};

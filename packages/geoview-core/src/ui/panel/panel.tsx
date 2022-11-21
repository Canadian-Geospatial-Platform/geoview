/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable no-nested-ternary */
import React, { useRef, useState, useEffect, useCallback, useContext } from 'react';

import { useTranslation } from 'react-i18next';

import FocusTrap from 'focus-trap-react';

import makeStyles from '@mui/styles/makeStyles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import { Cast } from '../../core/types/global-types';
import { HtmlToReact } from '../../core/containers/html-to-react';
import { MapContext } from '../../core/app-start';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/events/event-types';

import { IconButton, CloseIcon, PanelApi } from '..';
import { payloadBaseClass } from '../../api/events/payloads/payload-base-class';
import { payloadIsAPanelAction, payloadIsAPanelContent, payloadHasAButtonIdAndType } from '../../api/events/payloads/panel-payload';
import { inKeyfocusPayload } from '../../api/events/payloads/in-keyfocus-payload';
import { TypeIconButtonProps } from '../icon-button/icon-button-types';

/**
 * Interface for panel properties
 */
type TypePanelAppProps = {
  panel: PanelApi;
  //   panelOpen: boolean;
  button: TypeIconButtonProps;
};

const useStyles = makeStyles((theme) => ({
  panelContainer: {
    backgroundColor: theme.panel.background,
    color: theme.palette.primary.light,
    minWidth: 300,
    width: 350,
    height: '100%',
    borderRadius: 0,
    flexDirection: 'column',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      minWidth: '100%',
    },
  },
  panelHeader: {
    backgroundColor: theme.appBar.background,
    borderBottomColor: theme.panel.border,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    color: theme.palette.primary.light,
    height: 64,
  },
  panelHeaderTitle: {
    fontSize: 15,
    paddingTop: 8,
    textTransform: 'uppercase',
  },
  panelHeaderAction: {
    '& .MuiButtonBase-root': {
      border: `1px solid ${theme.appBar.btnDefaultBg}`,
      color: theme.palette.primary.light,
      height: 44,
      width: 44,
      marginRight: 8,
      transition: 'all 0.3s ease-in-out',
      '& .MuiSvgIcon-root': {
        width: 24,
        height: 24,
      },
      '&:last-child': {
        marginRight: 0,
      },
      '&:hover': {
        backgroundColor: theme.appBar.btnHoverBg,
      },
    },
  },
  panelContentContainer: {
    flexBasis: 'auto',
    overflow: 'hidden',
    overflowY: 'auto',
    boxSizing: 'border-box',
    marginBottom: 16,
    '&:last-child': {
      paddingBottom: 0,
    },
    height: '100%',
  },
}));

/**
 * Create a panel with a header title, icon and content
 * @param {TypePanelAppProps} props panel properties
 *
 * @returns {JSX.Element} the created Panel element
 */
export function Panel(props: TypePanelAppProps): JSX.Element {
  const { panel, button } = props;

  // set the active trap value for FocusTrap
  const [panelStatus, setPanelStatus] = useState(false);

  const [actionButtons, setActionButtons] = useState<JSX.Element[] & React.ReactNode[]>([]);
  const [, updatePanelContent] = useState(0);

  const classes = useStyles(props);
  const { t } = useTranslation<string>();

  const mapConfig = useContext(MapContext)!;
  const { mapId } = mapConfig;

  const panelRef = useRef<HTMLButtonElement>(null);
  const panelHeader = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

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
    api.event.emit(payloadBaseClass(EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_HIDE, mapId));

    const buttonElement = document.getElementById(mapId)?.querySelector(`#${button.id}`);

    if (buttonElement) {
      // put back focus on calling button
      document.getElementById(button.id!)?.focus();
    } else {
      const mapCont = api.map(mapConfig.mapId).map.getTargetElement();
      mapCont.focus();

      // if in focus trap mode, trigger the event
      if (mapCont.closest('.llwp-map')?.classList.contains('map-focus-trap')) {
        mapCont.classList.add('keyboard-focus');
        api.event.emit(inKeyfocusPayload(EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, `map-${mapId}`));
      }
    }

    setPanelStatus(false);
  };

  // listen to change panel content and rerender right after the panel has been created
  api.event.on(
    EVENT_NAMES.PANEL.EVENT_PANEL_CHANGE_CONTENT,
    (payload) => {
      if (payloadIsAPanelContent(payload)) {
        // set focus on close button on panel content change
        setTimeout(() => {
          if (closeBtnRef && closeBtnRef.current) (closeBtnRef.current as HTMLElement).focus();
        }, 100);

        if (payload.buttonId === button.id!) {
          updateComponent();
        }
      }
    },
    mapId,
    button.id!
  );

  useEffect(() => {
    // if the panel was still open on reload then close it
    if (panel.status) {
      panel.closeAll();
      setPanelStatus(true);
    }

    // listen to open panel to activate focus trap and focus on close
    api.event.on(
      EVENT_NAMES.PANEL.EVENT_PANEL_OPEN,
      (payload) => {
        if (payloadHasAButtonIdAndType(payload)) {
          if (payload.buttonId === button.id! && payload.handlerName === mapId) {
            // set focus on close button on panel open
            setPanelStatus(true);

            if (closeBtnRef && closeBtnRef.current) {
              (closeBtnRef.current as HTMLElement).focus();
            }
          }
        }
      },
      mapId,
      button.id!
    );

    api.event.on(
      EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE,
      (payload) => {
        if (payloadHasAButtonIdAndType(payload)) {
          if (payload.buttonId === button.id! && payload.handlerName === mapId) {
            closePanel();
          }
        }
      },
      mapId,
      button.id!
    );

    api.event.on(
      EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE_ALL,
      (payload) => {
        if (payloadHasAButtonIdAndType(payload)) {
          if (payload.handlerName === mapId) {
            setPanelStatus(false);
          }
        }
      },
      mapId,
      button.id!
    );

    // listen to add action button event
    api.event.on(
      EVENT_NAMES.PANEL.EVENT_PANEL_ADD_ACTION,
      (payload) => {
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
                  actionButton.children
                )}
              </IconButton>,
            ]);
          }
        }
      },
      mapId,
      button.id!
    );

    // listen to remove action button event
    api.event.on(
      EVENT_NAMES.PANEL.EVENT_PANEL_REMOVE_ACTION,
      (payload) => {
        if (payloadIsAPanelAction(payload)) {
          if (payload.buttonId === button.id!) {
            setActionButtons((list) =>
              list.filter((item) => {
                return item.props.id !== payload.actionButton.actionButtonId;
              })
            );
          }
        }
      },
      mapId,
      button.id!
    );

    return () => {
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_OPEN, mapId, button.id!);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE, mapId, button.id!);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE_ALL, mapId, button.id!);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_ADD_ACTION, mapId, button.id!);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_REMOVE_ACTION, mapId, button.id!);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_CHANGE_CONTENT, mapId, button.id!);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // set focus on close button on panel open
    if (closeBtnRef && closeBtnRef.current) if (button.visible) Cast<HTMLElement>(closeBtnRef.current).focus();
  }, [button, closeBtnRef]);

  return (
    <FocusTrap
      active={panelStatus}
      focusTrapOptions={{
        escapeDeactivates: false,
        clickOutsideDeactivates: true,
      }}
    >
      <Card
        ref={panelRef as React.MutableRefObject<null>}
        className={classes.panelContainer}
        style={{
          display: panelStatus ? 'flex' : 'none',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            closePanel();
          }
        }}
        {...{ 'data-id': button.id }}
      >
        <CardHeader
          classes={{
            root: classes.panelHeader,
            title: classes.panelHeaderTitle,
            action: classes.panelHeaderAction,
          }}
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
                  tooltip={t('general.close')}
                  tooltipPlacement="right"
                  aria-label={t('general.close')}
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

        <CardContent className={classes.panelContentContainer}>
          {typeof panel.content === 'string' ? <HtmlToReact htmlContent={panel.content} /> : panel.content}
        </CardContent>
      </Card>
    </FocusTrap>
  );
}

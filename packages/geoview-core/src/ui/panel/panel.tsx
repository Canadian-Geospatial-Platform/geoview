import { useRef, useState, useEffect, useCallback, ReactNode, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import FocusTrap from 'focus-trap-react';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import { useTheme } from '@mui/material/styles';
import { Cast } from '@/core/types/global-types';
import { HtmlToReact } from '@/core/containers/html-to-react';
import { api, useGeoViewMapId, useUIActiveTrapGeoView } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { IconButton, CloseIcon, PanelApi, Box } from '..';
import { payloadIsAPanelAction, PayloadBaseClass } from '@/api/events/payloads';
import { logger } from '@/core/utils/logger';

import { TypeIconButtonProps } from '../icon-button/icon-button-types';
import { getSxClasses } from './panel-style';

/**
 * Interface for panel properties
 */
type TypePanelAppProps = {
  panel: PanelApi;
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
  const { status: open, panelStyles } = panel;

  const mapId = useGeoViewMapId();

  const { t } = useTranslation<string>();

  // Get the theme
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  // set the active trap value for FocusTrap
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const [actionButtons, setActionButtons] = useState<JSX.Element[] & ReactNode[]>([]);
  const panelRef = useRef<HTMLButtonElement>(null);
  const panelHeader = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelWidth = panel?.width ?? 350;
  const panelContainerStyles = {
    ...(panelStyles?.panelContainer && { ...panelStyles.panelContainer }),
    width: open ? panelWidth : 0,
    maxWidth: 400,
    [theme.breakpoints.down('sm')]: {
      width: 'calc(100% - 64px)',
      maxWidth: 'calc(100% - 64px)',
    },
    transition: `width ${theme.transitions.duration.standard}ms ease`,
    position: 'absolute',
    left: '64px',
    height: '100%',
  };

  const panelAddActionListenerFunction = useCallback(
    (payload: PayloadBaseClass) => {
      // Log
      logger.logTraceCoreAPIEvent('UI.PANEL - panelAddActionListenerFunction', payload);

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
    },
    [button.id]
  );

  const panelRemoveActionListenerFunction = useCallback(
    (payload: PayloadBaseClass) => {
      // Log
      logger.logTraceCoreAPIEvent('UI.PANEL - panelRemoveActionListenerFunction', payload);

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
    [button]
  );

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

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('UI.PANEL - mount');

    // listen to add action button event
    api.event.on(EVENT_NAMES.PANEL.EVENT_PANEL_ADD_ACTION, panelAddActionListenerFunction, `${mapId}/${button.id!}`);

    // listen to remove action button event
    api.event.on(EVENT_NAMES.PANEL.EVENT_PANEL_REMOVE_ACTION, panelRemoveActionListenerFunction, `${mapId}/${button.id!}`);

    return () => {
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_REMOVE_ACTION, `${mapId}/${button.id!}`, panelRemoveActionListenerFunction);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_ADD_ACTION, `${mapId}/${button.id!}`, panelAddActionListenerFunction);
    };
  }, [mapId, button.id, panel, panelAddActionListenerFunction, panelRemoveActionListenerFunction]);

  // TODO: refactor - remove comment in tsx for production build facebook/create-react-app#9507
  return (
    <Box sx={panelContainerStyles}>
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
            title={t(panel.title)}
            titleTypographyProps={{
              component: 'h2',
            }}
            action={
              open ? (
                <>
                  {actionButtons}
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
                </>
              ) : (
                // eslint-disable-next-line react/jsx-no-useless-fragment
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
  onPanelOpened: null,
  onPanelClosed: null,
  onGeneralCloseClicked: null,
};

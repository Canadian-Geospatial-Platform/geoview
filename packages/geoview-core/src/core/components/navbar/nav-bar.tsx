import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';

import ZoomIn from './buttons/zoom-in';
import ZoomOut from './buttons/zoom-out';
import Fullscreen from './buttons/fullscreen';
import Home from './buttons/home';

import { api } from '../../../app';
import { Panel, ButtonGroup, IconButton } from '../../../ui';

import { MapContext } from '../../app-start';
import { TypeButtonPanel } from '../../types/cgpv-types';

import { EVENT_NAMES } from '../../../api/events/event';
import { payloadIsAButtonPanel, ButtonPanelPayload } from '../../../api/events/payloads/button-panel-payload';

const navBtnWidth = '44px';
const navBtnHeight = '44px';

const useStyles = makeStyles((theme) => ({
  navBarRef: {
    position: 'absolute',
    right: theme.spacing(5),
    bottom: 32,
    height: '600px',
    display: 'flex',
    flexDirection: 'row',
    marginRight: 0,
    zIndex: theme.zIndex.appBar,
    pointerEvents: 'all',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  navBtnGroupContainer: {
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    pointerEvents: 'auto',
    justifyContent: 'end',
    overflowY: 'hidden',
    padding: 5,
  },
  navBtnGroup: {
    borderRadius: theme.spacing(5),
    '&:not(:last-child)': {
      marginBottom: theme.spacing(11),
    },
    '& .MuiButtonGroup-grouped:not(:last-child)': {
      borderColor: theme.navBar.borderColor,
    },
  },
  navBarButton: {
    backgroundColor: theme.navBar.btnDefaultBg,
    color: theme.navBar.btnDefaultColor,
    borderRadius: theme.spacing(5),
    width: navBtnWidth,
    height: navBtnHeight,
    maxWidth: navBtnWidth,
    minWidth: navBtnWidth,
    padding: 'initial',
    transition: 'background-color 0.3s ease-in-out',
    '&:not(:last-of-type)': {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderBottom: `1px solid ${theme.navBar.borderColor}`,
    },
    '&:not(:first-of-type)': {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
    '&:hover': {
      backgroundColor: theme.navBar.btnHoverBg,
      color: theme.navBar.btnHoverColor,
    },
    '&:focus': {
      backgroundColor: theme.navBar.btnFocusBg,
      color: theme.navBar.btnFocusColor,
    },
    '&:active': {
      backgroundColor: theme.navBar.btnFocusBg,
      color: theme.navBar.btnActiveColor,
    },
  },
}));

/**
 * Create a navbar with buttons that can call functions or open custom panels
 */
export function Navbar(): JSX.Element {
  const [buttonPanelGroups, setButtonPanelGroups] = useState<Record<string, Record<string, TypeButtonPanel>>>({});

  const classes = useStyles();

  const { t } = useTranslation<string>();

  const navBarRef = useRef<HTMLDivElement>(null);

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  const addButtonPanel = useCallback(
    (payload: ButtonPanelPayload) => {
      setButtonPanelGroups({
        ...buttonPanelGroups,
        [payload.groupName]: {
          ...buttonPanelGroups[payload.groupName],
          [payload.id]: payload.buttonPanel as TypeButtonPanel,
        },
      });
    },
    [buttonPanelGroups]
  );

  const removeButtonPanel = useCallback(
    (payload: ButtonPanelPayload) => {
      setButtonPanelGroups((prevState) => {
        const state = { ...prevState };

        const group = state[payload.groupName];

        delete group[payload.id];

        return state;
      });
    },
    [setButtonPanelGroups]
  );

  useEffect(() => {
    // listen to new navbar panel creation
    api.event.on(
      EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_CREATE,
      (payload) => {
        if (payloadIsAButtonPanel(payload)) {
          if (payload.handlerName && payload.handlerName === mapId) {
            addButtonPanel(payload);
          }
        }
      },
      mapId
    );

    // listen to new navbar panel removal
    api.event.on(
      EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_REMOVE,
      (payload) => {
        if (payloadIsAButtonPanel(payload)) {
          if (payload.handlerName && payload.handlerName === mapId) {
            removeButtonPanel(payload);
          }
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_CREATE, mapId);
      api.event.off(EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_REMOVE, mapId);
    };
  }, [addButtonPanel, mapId, removeButtonPanel]);

  return (
    /** TODO - KenChase Need to add styling for scenario when more buttons that can fit vertically occurs (or limit number of buttons that can be added) */
    <div ref={navBarRef} className={`${classes.navBarRef}`}>
      {Object.keys(buttonPanelGroups).map((groupName) => {
        const buttons = buttonPanelGroups[groupName];

        // display the panels in the list
        const panels = Object.keys(buttons).map((buttonId) => {
          const buttonPanel = buttons[buttonId];

          return buttonPanel.panel ? <Panel key={buttonPanel.button.id} button={buttonPanel.button} panel={buttonPanel.panel} /> : null;
        });

        if (panels.length > 0) {
          return <div key={groupName}>{panels}</div>;
        }
        return null;
      })}

      <div className={classes.navBtnGroupContainer}>
        {Object.keys(buttonPanelGroups).map((groupName) => {
          const buttons = buttonPanelGroups[groupName];

          // if not an empty object, only then render any HTML
          if (Object.keys(buttons).length !== 0) {
            return (
              <ButtonGroup
                key={groupName}
                orientation="vertical"
                aria-label={t('mapnav.arianavbar')}
                variant="contained"
                classes={{ root: classes.navBtnGroup }}
              >
                {Object.keys(buttons).map((buttonId) => {
                  const buttonPanel: TypeButtonPanel = buttons[buttonId];
                  // eslint-disable-next-line no-nested-ternary
                  return buttonPanel.button.visible ? (
                    !buttonPanel.panel ? (
                      <IconButton
                        key={buttonPanel.button.id}
                        id={buttonPanel.button.id}
                        tooltip={buttonPanel.button.tooltip}
                        tooltipPlacement={buttonPanel.button.tooltipPlacement}
                        className={classes.navBarButton}
                        onClick={buttonPanel.button.onClick}
                      >
                        {buttonPanel.button.children}
                      </IconButton>
                    ) : (
                      <IconButton
                        key={buttonPanel.button.id}
                        id={buttonPanel.button.id}
                        tooltip={buttonPanel.button.tooltip}
                        tooltipPlacement={buttonPanel.button.tooltipPlacement}
                        className={classes.navBarButton}
                        onClick={() => {
                          if (!buttonPanel.panel?.status) {
                            buttonPanel.panel?.open();
                          } else {
                            buttonPanel.panel?.close();
                          }
                        }}
                      >
                        {buttonPanel.button.children}
                      </IconButton>
                    )
                  ) : null;
                })}
              </ButtonGroup>
            );
          }
          return null;
        })}
        <ButtonGroup orientation="vertical" aria-label={t('mapnav.arianavbar')} variant="contained" classes={{ root: classes.navBtnGroup }}>
          <ZoomIn className={classes.navBarButton} />
          <ZoomOut className={classes.navBarButton} />
        </ButtonGroup>
        <ButtonGroup orientation="vertical" aria-label={t('mapnav.arianavbar')} variant="contained" classes={{ root: classes.navBtnGroup }}>
          <Fullscreen className={classes.navBarButton} />
          <Home className={classes.navBarButton} />
        </ButtonGroup>
      </div>
    </div>
  );
}

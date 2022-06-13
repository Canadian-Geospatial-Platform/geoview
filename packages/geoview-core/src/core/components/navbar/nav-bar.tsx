import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';

import ZoomIn from './buttons/zoom-in';
import ZoomOut from './buttons/zoom-out';
import Fullscreen from './buttons/fullscreen';
import Home from './buttons/home';

import { api } from '../../../app';
import { Panel, ButtonGroup, Button } from '../../../ui';

import { MapContext } from '../../app-start';
import { TypeButtonPanel } from '../../types/cgpv-types';

import { EVENT_NAMES } from '../../../api/events/event';
import { payloadIsAButtonPanel, ButtonPanelPayload } from '../../../api/events/payloads/button-panel-payload';

const navBtnWidth = '32px';
const navBtnHeight = '32px';

const useStyles = makeStyles((theme) => ({
  navBarRef: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'row',
    paddingBottom: 30,
    zIndex: theme.zIndex.appBar,
    pointerEvents: 'all',
    height: '100%',
    overflow: 'auto',
    justifyContent: 'center',
    width: 40,
    backgroundColor: 'transparent',
  },
  navBtnGroupContainer: {
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    pointerEvents: 'auto',
    justifyContent: 'end',
  },
  navBtnGroup: {
    '&:not(:last-child)': {
      marginBottom: theme.spacing(2),
    },
    borderTopLeftRadius: theme.spacing(5),
    borderTopRightRadius: theme.spacing(5),
    borderBottomLeftRadius: theme.spacing(5),
    borderBottomRightRadius: theme.spacing(5),
  },
  navBarButton: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.dark,
    borderRadius: theme.spacing(5),
    width: navBtnWidth,
    height: navBtnHeight,
    maxWidth: navBtnWidth,
    minWidth: navBtnWidth,
    padding: 'initial',
    '&:hover': {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.dark,
    },
  },
  navBarButtonIcon: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.dark,
    '&:hover *': {
      fontSize: '1.8rem',
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
                className={classes.navBtnGroup}
              >
                {Object.keys(buttons).map((buttonId) => {
                  const buttonPanel: TypeButtonPanel = buttons[buttonId];
                  // eslint-disable-next-line no-nested-ternary
                  return buttonPanel.button.visible ? (
                    !buttonPanel.panel ? (
                      <Button
                        key={buttonPanel.button.id}
                        id={buttonPanel.button.id}
                        type="icon"
                        tooltip={buttonPanel.button.tooltip}
                        tooltipPlacement="left"
                        icon={buttonPanel.button.icon}
                        className={classes.navBarButton}
                        onClick={buttonPanel.button.onClick}
                      />
                    ) : (
                      <Button
                        key={buttonPanel.button.id}
                        id={buttonPanel.button.id}
                        type="icon"
                        tooltip={buttonPanel.button.tooltip}
                        tooltipPlacement="left"
                        icon={buttonPanel.button.icon}
                        className={classes.navBarButton}
                        onClick={() => {
                          if (!buttonPanel.panel?.status) {
                            buttonPanel.panel?.open();
                          } else {
                            buttonPanel.panel?.close();
                          }
                        }}
                      />
                    )
                  ) : null;
                })}
              </ButtonGroup>
            );
          }
          return null;
        })}
        <ButtonGroup orientation="vertical" aria-label={t('mapnav.arianavbar')} variant="contained" className={classes.navBtnGroup}>
          <ZoomIn className={classes.navBarButton} iconClassName={classes.navBarButtonIcon} />
          <ZoomOut className={classes.navBarButton} iconClassName={classes.navBarButtonIcon} />
        </ButtonGroup>
        <ButtonGroup orientation="vertical" aria-label={t('mapnav.arianavbar', '')} variant="contained" className={classes.navBtnGroup}>
          <Fullscreen className={classes.navBarButton} iconClassName={classes.navBarButtonIcon} />
          <Home className={classes.navBarButton} iconClassName={classes.navBarButtonIcon} />
        </ButtonGroup>
      </div>
    </div>
  );
}

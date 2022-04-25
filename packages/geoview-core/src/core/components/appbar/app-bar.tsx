import { useState, useRef, useEffect, useCallback, Fragment, useContext } from 'react';

import makeStyles from '@mui/styles/makeStyles';

import { Divider, List, ListItem, Panel, Button } from '../../../ui';

import { api } from '../../../app';
import { EVENT_NAMES } from '../../../api/events/event';

import { MapContext } from '../../app-start';

import { LEAFLET_POSITION_CLASSES } from '../../../geo/utils/constant';
import { payloadIsAButtonPanel } from '../../../api/events/payloads/button-panel-payload';
import { payloadHasAButtonIdAndType } from '../../../api/events/payloads/panel-payload';

import { TypeButtonPanel } from '../../types/cgpv-types';

export const useStyles = makeStyles((theme) => ({
  appBar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: '100%',
    zIndex: theme.zIndex.appBar,
    pointerEvents: 'all',
    backgroundColor: theme.palette.primary.dark,
  },
  appBarButtons: {
    overflowY: 'auto',
    overflowX: 'hidden',
    width: 50,
  },
  appBarButton: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.light,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      color: theme.palette.primary.light,
    },
  },
  appBarButtonIcon: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.light,
  },
  appBarPanels: {},
}));

/**
 * Create an appbar with buttons that can open a panel
 */
export function Appbar(): JSX.Element {
  const [refreshCount, setRefreshCount] = useState(0);
  const [buttonPanelGroups, setButtonPanelGroups] = useState<Record<string, Record<string, TypeButtonPanel>>>({});

  const classes = useStyles();

  const appBar = useRef<HTMLDivElement>(null);

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  const addButtonPanel = useCallback(
    (payload) => {
      setButtonPanelGroups({
        ...buttonPanelGroups,
        [payload.groupName]: {
          ...buttonPanelGroups[payload.groupName],
          [payload.id]: payload.buttonPanel,
        },
      });
    },
    [setButtonPanelGroups, buttonPanelGroups]
  );

  const removeButtonPanel = useCallback(
    (payload) => {
      setButtonPanelGroups((prevState) => {
        const state = { ...prevState };

        const group = state[payload.groupName];

        delete group[payload.id];

        return state;
      });
    },
    [setButtonPanelGroups]
  );

  /**
   * function that causes rerender when changing appbar content
   */
  const updateComponent = useCallback(() => {
    setRefreshCount((refresh) => refresh + 1);
  }, []);

  useEffect(() => {
    // listen to new panel creation
    api.event.on(
      EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE,
      (payload) => {
        if (payloadIsAButtonPanel(payload)) {
          if (payload.handlerName && payload.handlerName === mapId) {
            addButtonPanel(payload);
          }
        }
      },
      mapId
    );

    // listen on panel removal
    api.event.on(
      EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE,
      (payload) => {
        if (payloadIsAButtonPanel(payload)) {
          if (payload.handlerName && payload.handlerName === mapId) {
            removeButtonPanel(payload);
          }
        }
      },
      mapId
    );

    // listen to open panel to activate focus trap and focus on close
    api.event.on(
      EVENT_NAMES.PANEL.EVENT_PANEL_OPEN,
      (payload) => {
        if (payloadHasAButtonIdAndType(payload)) {
          if (payload.handlerName === mapId && payload.type === 'appbar') {
            updateComponent();
          }
        }
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE,
      (payload) => {
        if (payloadHasAButtonIdAndType(payload)) {
          if (payload.handlerName === mapId && payload.type === 'appbar') {
            updateComponent();
          }
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE, mapId);
      api.event.off(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE, mapId);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_OPEN, mapId);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE, mapId);
    };
  }, [addButtonPanel, mapId, removeButtonPanel, updateComponent]);

  return (
    <div className={`${LEAFLET_POSITION_CLASSES.topleft} ${classes.appBar}`} ref={appBar}>
      <div className={classes.appBarButtons}>
        {Object.keys(buttonPanelGroups).map((groupName: string) => {
          // get button panels from group
          const buttonPanels = buttonPanelGroups[groupName];

          // display the button panels in the list
          return (
            <List key={groupName}>
              {Object.keys(buttonPanels).map((buttonId) => {
                const buttonPanel = buttonPanels[buttonId];

                return buttonPanel?.button.visible !== undefined && buttonPanel?.button.visible ? (
                  <Fragment key={buttonPanel.button.id}>
                    <ListItem>
                      <Button
                        id={buttonPanel.button.id}
                        variant="text"
                        tooltip={buttonPanel.button.tooltip}
                        tooltipPlacement="right"
                        type="icon"
                        className={classes.appBarButton}
                        iconClassName={classes.appBarButtonIcon}
                        onClick={() => {
                          if (!buttonPanel.panel?.status) {
                            buttonPanel.panel?.open();
                          } else {
                            buttonPanel.panel?.close();
                          }
                        }}
                        icon={buttonPanel.button.icon}
                      >
                        {buttonPanel.button.tooltip}
                      </Button>
                    </ListItem>
                    <Divider />
                  </Fragment>
                ) : null;
              })}
            </List>
          );
        })}
      </div>
      {Object.keys(buttonPanelGroups).map((groupName: string) => {
        // get button panels from group
        const buttonPanels = buttonPanelGroups[groupName];

        // display the panels in the list
        return (
          <div key={groupName}>
            {Object.keys(buttonPanels).map((buttonId) => {
              const buttonPanel = buttonPanels[buttonId];

              return buttonPanel?.panel ? (
                <Panel key={buttonPanel.button.id} panel={buttonPanel.panel} button={buttonPanel.button} />
              ) : null;
            })}
          </div>
        );
      })}
    </div>
  );
}

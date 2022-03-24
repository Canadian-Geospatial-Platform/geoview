import { useState, useRef, useEffect, useCallback, Fragment, useContext } from 'react';

import makeStyles from '@mui/styles/makeStyles';

import { Divider, List, ListItem, Panel, Button } from '../../../ui';

import { api } from '../../../api/api';
import { EVENT_NAMES } from '../../../api/event';

import { MapContext } from '../../app-start';

import { LEAFLET_POSITION_CLASSES } from '../../../geo/utils/constant';

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

  const classes = useStyles();

  const appBar = useRef<HTMLDivElement>(null);

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  /**
   * function that causes rerender when changing appbar content
   */
  const updateComponent = useCallback(() => {
    setRefreshCount((refresh) => refresh + 1);
  }, []);

  useEffect(() => {
    // listen to new panel creation
    api.event.on(
      EVENT_NAMES.EVENT_APPBAR_PANEL_CREATE,
      (payload) => {
        if (payload && payload.handlerName && payload.handlerName === mapId) {
          updateComponent();
        }
      },
      mapId
    );

    // listen on panel removal
    api.event.on(
      EVENT_NAMES.EVENT_APPBAR_PANEL_REMOVE,
      (payload) => {
        if (payload && payload.handlerName && payload.handlerName === mapId) {
          updateComponent();
        }
      },
      mapId
    );

    // listen to open panel to activate focus trap and focus on close
    api.event.on(
      EVENT_NAMES.EVENT_PANEL_OPEN,
      (args) => {
        if (args.handlerName === mapId && args.type === 'appbar') {
          updateComponent();
        }
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.EVENT_PANEL_CLOSE,
      (args) => {
        if (args.handlerName === mapId && args.type === 'appbar') {
          updateComponent();
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.EVENT_APPBAR_PANEL_CREATE, mapId);
      api.event.off(EVENT_NAMES.EVENT_APPBAR_PANEL_REMOVE, mapId);
      api.event.off(EVENT_NAMES.EVENT_PANEL_OPEN, mapId);
      api.event.off(EVENT_NAMES.EVENT_PANEL_CLOSE, mapId);
    };
  }, [mapId, updateComponent]);

  return (
    <div className={`${LEAFLET_POSITION_CLASSES.topleft} ${classes.appBar}`} ref={appBar}>
      {Object.keys(api.map(mapId).appBarButtons.getAllButtonPanels()).filter((buttonPanel) => {
        return api.map(mapId).appBarButtons.getAllButtonPanels()[buttonPanel].button?.visible;
      }).length > 0 && (
        <div className={classes.appBarButtons}>
          {Object.keys(api.map(mapId).appBarButtons.buttons).map((groupName: string) => {
            // get button panels from group
            const buttonPanels = api.map(mapId).appBarButtons.buttons[groupName];

            // display the button panels in the list
            return (
              <List key={groupName}>
                {Object.keys(buttonPanels).map((buttonId) => {
                  const buttonPanel = buttonPanels[buttonId];

                  return buttonPanel?.button.visible !== undefined && buttonPanel?.button.visible ? (
                    <Fragment key={`${buttonPanel.button.id}-${refreshCount}`}>
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
      )}
      {Object.keys(api.map(mapId).appBarButtons.buttons).map((groupName: string) => {
        // get button panels from group
        const buttonPanels = api.map(mapId).appBarButtons.buttons[groupName];

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

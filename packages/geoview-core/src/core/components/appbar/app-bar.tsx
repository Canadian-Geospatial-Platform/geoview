import { useState, useRef, useEffect, useCallback, Fragment } from "react";

import { DomEvent } from "leaflet";
import { useMap } from "react-leaflet";

import makeStyles from '@mui/styles/makeStyles';

import Version from "./buttons/version";

import { Divider, Drawer, List, ListItem, Panel, Button } from "../../../ui";

import { api } from "../../../api/api";
import { EVENT_NAMES } from "../../../api/event";

import { CONST_PANEL_TYPES } from "../../types/cgpv-types";

export const useStyles = makeStyles((theme) => ({
  appBar: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    height: "100%",
    margin: theme.spacing(2, 2),
    border: "2px solid rgba(0, 0, 0, 0.2)",
  },
}));

/**
 * Create an appbar with buttons that can open a panel
 */
export function Appbar(): JSX.Element {
  const [buttonPanelId, setButtonPanelId] = useState<string>();
  const [panelOpen, setPanelOpen] = useState(false);
  const [, setPanelCount] = useState(0);
  const [drawerStatus, setDrawerStatus] = useState<boolean>(false);

  const classes = useStyles();

  const map = useMap();

  const appBar = useRef<HTMLDivElement>(null);

  const mapId = api.mapInstance(map).id;

  /**
   * function that causes rerender when adding a new panel
   */
  const updatePanelCount = useCallback(() => {
    setPanelCount((count) => count + 1);
  }, []);

  /**
   * Open / Close the panel
   * @param {boolean} status status of the panel
   */
  const openClosePanel = (status: boolean): void => {
    api.event.emit(EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE, mapId, {
      panelType: CONST_PANEL_TYPES.APPBAR,
      handlerId: mapId,
      status,
    });

    // if appbar is open then close it
    api.event.emit(EVENT_NAMES.EVENT_DRAWER_OPEN_CLOSE, mapId, {
      status: false,
    });
  };

  useEffect(() => {
    const appBarChildren = appBar.current?.children[0] as HTMLElement;
    // disable events on container
    DomEvent.disableClickPropagation(appBarChildren);
    DomEvent.disableScrollPropagation(appBarChildren);

    // listen to drawer open/close events
    api.event.on(
      EVENT_NAMES.EVENT_DRAWER_OPEN_CLOSE,
      (payload) => {
        if (payload && payload.handlerName === mapId) {
          setDrawerStatus(payload.status);
        }
      },
      mapId
    );

    // listen to panel open/close events
    api.event.on(
      EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE,
      (payload) => {
        if (
          payload &&
          payload.handlerId === mapId &&
          payload.panelType === CONST_PANEL_TYPES.APPBAR
        )
          setPanelOpen(payload.status);
      },
      mapId
    );

    // listen to new panel creation
    api.event.on(EVENT_NAMES.EVENT_APPBAR_PANEL_CREATE, () => {
      updatePanelCount();
    });

    // listen on panel removal
    api.event.on(EVENT_NAMES.EVENT_APPBAR_PANEL_REMOVE, () => {
      updatePanelCount();
    });

    // listen to event when a request to open a panel
    api.event.on(
      EVENT_NAMES.EVENT_PANEL_OPEN,
      (args) => {
        if (args.handlerId === mapId) {
          const buttonPanel = Object.keys(
            api.map(mapId).appBarButtons.buttons
          ).map((groupName: string) => {
            const buttonPanels =
              api.map(mapId).appBarButtons.buttons[groupName];

            return buttonPanels[args.buttonId];
          })[0];

          if (buttonPanel) {
            setButtonPanelId(buttonPanel.button.id);
            openClosePanel(!panelOpen);
          }
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.EVENT_PANEL_OPEN);
      api.event.off(EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE);
      api.event.off(EVENT_NAMES.EVENT_APPBAR_PANEL_CREATE);
      api.event.off(EVENT_NAMES.EVENT_APPBAR_PANEL_REMOVE);
      api.event.off(EVENT_NAMES.EVENT_DRAWER_OPEN_CLOSE);
    };
  }, []);

  return (
    <div className={classes.appBar} ref={appBar}>
      <Drawer>
        <Divider />
        <div>
          {Object.keys(api.map(mapId).appBarButtons.buttons).map(
            (groupName: string) => {
              // get button panels from group
              const buttonPanels =
                api.map(mapId).appBarButtons.buttons[groupName];

              // display the button panels in the list
              return (
                <List key={groupName}>
                  {Object.keys(buttonPanels).map((buttonId) => {
                    const buttonPanel = buttonPanels[buttonId];

                    return buttonPanel.button.visible ? (
                        <Fragment  key={buttonPanel.button.id}>
                          <ListItem>
                            <Button
                              id={buttonPanel.button.id}
                              variant="text"
                              tooltip={buttonPanel.button.tooltip}
                              tooltipPlacement="right"
                              type="textWithIcon"
                              onClick={() => {
                                setButtonPanelId(buttonPanel.button.id);
                                openClosePanel(!panelOpen);
                              }}
                              icon={buttonPanel.button.icon}
                              children={buttonPanel.button.tooltip}
                              state={drawerStatus ? "expanded" : "collapsed"}
                            />
                          </ListItem>
                        <Divider grow={true} />
                        <Divider />
                        </Fragment>
                    ) : null;
                  })}
                </List>
              );
            }
          )}
        </div>
        <Divider grow={true} />
        <Divider />
        <Version drawerStatus={drawerStatus} />
      </Drawer>
      {Object.keys(api.mapInstance(map).appBarButtons.buttons).map(
        (groupName: string) => {
          // get button panels from group
          const buttonPanels =
            api.mapInstance(map).appBarButtons.buttons[groupName];

          // display the panels in the list
          return (
            <div key={groupName}>
              {Object.keys(buttonPanels).map((buttonId) => {
                const buttonPanel = buttonPanels[buttonId];

                const isOpen =
                  buttonPanelId === buttonPanel.button.id && panelOpen;

                return buttonPanel.panel ? (
                  <Panel
                    key={buttonPanel.button.id}
                    panel={buttonPanel.panel}
                    button={buttonPanel.button}
                    panelOpen={isOpen}
                  />
                ) : null;
              })}
            </div>
          );
        }
      )}
    </div>
  );
}

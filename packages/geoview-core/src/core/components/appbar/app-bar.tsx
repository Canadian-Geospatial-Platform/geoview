import { useState, useRef, useEffect, useCallback, Fragment } from "react";

import { DomEvent } from "leaflet";
import { useMap } from "react-leaflet";

import makeStyles from "@mui/styles/makeStyles";

import Version from "./buttons/version";

import { Divider, Drawer, List, ListItem, Panel, Button } from "../../../ui";

import { api } from "../../../api/api";
import { EVENT_NAMES } from "../../../api/event";

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
  const [panelCount, setPanelCount] = useState(0);
  const [drawerStatus, setDrawerStatus] = useState<boolean>(false);

  const classes = useStyles();

  const map = useMap();

  const appBar = useRef<HTMLDivElement>(null);

  const mapId = api.mapInstance(map)!.id;

  /**
   * function that causes rerender when adding a new panel
   */
  const updatePanelCount = useCallback(() => {
    setPanelCount((count) => count + 1);
  }, []);

  /**
   * Open / Close drawer
   */
  const openClosePanel = (): void => {
    // if appbar is open then close it
    api.event.emit(EVENT_NAMES.EVENT_DRAWER_OPEN_CLOSE, mapId, {
      status: false,
    });
  };

  /**
   * Close all open panels
   */
  const closeAllPanels = (): void => {
    Object.keys(api.map(mapId).appBarButtons.buttons).map(
      (groupName: string) => {
        // get button panels from group
        const buttonPanels = api.map(mapId).appBarButtons.buttons[groupName];

        // get all button panels in each group
        Object.keys(buttonPanels).map((buttonId) => {
          const buttonPanel = buttonPanels[buttonId];

          buttonPanel.panel?.close();
        });
      }
    );
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

    // listen to new panel creation
    api.event.on(EVENT_NAMES.EVENT_APPBAR_PANEL_CREATE, () => {
      updatePanelCount();
    });

    // listen on panel removal
    api.event.on(EVENT_NAMES.EVENT_APPBAR_PANEL_REMOVE, () => {
      updatePanelCount();
    });

    return () => {
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
                      <Fragment key={buttonPanel.button.id}>
                        <ListItem>
                          <Button
                            id={buttonPanel.button.id}
                            variant="text"
                            tooltip={buttonPanel.button.tooltip}
                            tooltipPlacement="right"
                            type="textWithIcon"
                            onClick={() => {
                              if (buttonPanel.panel?.status) {
                                buttonPanel.panel?.close();
                              } else {
                                closeAllPanels();

                                buttonPanel.panel?.open();
                              }
                              openClosePanel();
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
      {Object.keys(api.map(mapId).appBarButtons.buttons).map(
        (groupName: string) => {
          // get button panels from group
          const buttonPanels = api.map(mapId).appBarButtons.buttons[groupName];

          // display the panels in the list
          return (
            <div key={groupName}>
              {Object.keys(buttonPanels).map((buttonId) => {
                const buttonPanel = buttonPanels[buttonId];

                return buttonPanel.panel ? (
                  <Panel
                    key={buttonPanel.button.id}
                    panel={buttonPanel.panel}
                    button={buttonPanel.button}
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

import { useState, useRef, useEffect, useCallback, Fragment } from "react";

import { DomEvent } from "leaflet";
import { useMap } from "react-leaflet";

import makeStyles from "@mui/styles/makeStyles";

import Version from "./buttons/version";

import { Divider, Drawer, List, ListItem, Panel, Button } from "../../../ui";

import { api } from "../../../api/api";
import { EVENT_NAMES } from "../../../api/event";

import { TypeButtonPanel } from "../../types/cgpv-types";

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
  const [drawerStatus, setDrawerStatus] = useState<boolean>(false);
  const [buttonPanelGroups, setButtonPanelGroups] = useState<
    Record<string, Record<string, TypeButtonPanel>>
  >({});

  const classes = useStyles();

  const map = useMap();

  const appBar = useRef<HTMLDivElement>(null);

  const mapId = api.mapInstance(map)!.id;

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
    [setButtonPanelGroups, buttonPanelGroups]
  );

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

    return () => {
      api.event.off(EVENT_NAMES.EVENT_DRAWER_OPEN_CLOSE, mapId);
    };
  }, []);

  useEffect(() => {
    // listen to new panel creation
    api.event.on(
      EVENT_NAMES.EVENT_APPBAR_PANEL_CREATE,
      (payload) => {
        if (payload && payload.handlerName && payload.handlerName === mapId) {
          addButtonPanel(payload);
        }
      },
      mapId
    );

    // listen on panel removal
    api.event.on(
      EVENT_NAMES.EVENT_APPBAR_PANEL_REMOVE,
      (payload) => {
        if (payload && payload.handlerName && payload.handlerName === mapId) {
          removeButtonPanel(payload);
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.EVENT_APPBAR_PANEL_CREATE, mapId);
      api.event.off(EVENT_NAMES.EVENT_APPBAR_PANEL_REMOVE, mapId);
    };
  }, [addButtonPanel, removeButtonPanel]);

  return (
    <div className={classes.appBar} ref={appBar}>
      <Drawer>
        <Divider />
        <div>
          {Object.keys(buttonPanelGroups).map((groupName: string) => {
            // get button panels from group
            const buttonPanels = buttonPanelGroups[groupName];

            // display the button panels in the list
            return (
              <List key={groupName}>
                {Object.keys(buttonPanels).map((buttonId) => {
                  const buttonPanel = buttonPanels[buttonId];

                  return buttonPanel?.button.visible ? (
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
                      <Divider />
                    </Fragment>
                  ) : null;
                })}
              </List>
            );
          })}
        </div>
        <Divider grow={true} />
        <Version drawerStatus={drawerStatus} />
      </Drawer>
      {Object.keys(buttonPanelGroups).map((groupName: string) => {
        // get button panels from group
        const buttonPanels = buttonPanelGroups[groupName];

        // display the panels in the list
        return (
          <div key={groupName}>
            {Object.keys(buttonPanels).map((buttonId) => {
              const buttonPanel = buttonPanels[buttonId];

              return buttonPanel?.panel ? (
                <Panel
                  key={buttonPanel.button.id}
                  panel={buttonPanel.panel}
                  button={buttonPanel.button}
                />
              ) : null;
            })}
          </div>
        );
      })}
    </div>
  );
}

import { useState, useRef, useEffect, useCallback, Fragment } from "react";

import { DomEvent } from "leaflet";
import { useMap } from "react-leaflet";

import makeStyles from "@mui/styles/makeStyles";

import Version from "./buttons/version";

import {
  Divider,
  Drawer,
  List,
  ListItem,
  Panel,
  Button,
  DefaultPanel,
} from "../../../ui";

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
  const [, updateAppbar] = useState(0);

  const [drawerStatus, setDrawerStatus] = useState<boolean>(false);
  //   const [buttonPanelGroups, setButtonPanelGroups] = useState<
  //     Record<string, Record<string, TypeButtonPanel>>
  //   >({});

  /**
   * function that causes rerender when changing appbar content
   */
  const updateComponent = useCallback(() => {
    updateAppbar((refresh) => refresh + 1);
  }, []);

  const classes = useStyles();

  const map = useMap();

  const appBar = useRef<HTMLDivElement>(null);

  const mapId = api.mapInstance(map)!.id;

  //   const addButtonPanel = useCallback(
  //     (payload) => {
  //       setButtonPanelGroups({
  //         ...buttonPanelGroups,
  //         [payload.groupName]: {
  //           ...buttonPanelGroups[payload.groupName],
  //           [payload.id]: payload.buttonPanel,
  //         },
  //       });
  //     },
  //     [setButtonPanelGroups, buttonPanelGroups]
  //   );

  //   const removeButtonPanel = useCallback(
  //     (payload) => {
  //       setButtonPanelGroups((prevState) => {
  //         const state = { ...prevState };

  //         const group = state[payload.groupName];

  //         delete group[payload.id];

  //         return state;
  //       });
  //     },
  //     [setButtonPanelGroups, buttonPanelGroups]
  //   );

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
          //   addButtonPanel(payload);
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
          //   removeButtonPanel(payload);
          updateComponent();
        }
      },
      mapId
    );

    // listen to open panel to activate focus trap and focus on close
    api.event.on(
      EVENT_NAMES.EVENT_PANEL_OPEN,
      (args) => {
        if (args.handlerName === mapId) updateComponent();
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.EVENT_PANEL_CLOSE,
      (args) => {
        if (args.handlerName === mapId) updateComponent();
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.EVENT_APPBAR_PANEL_CREATE, mapId);
      api.event.off(EVENT_NAMES.EVENT_APPBAR_PANEL_REMOVE, mapId);
    };
  }, [updateComponent]);

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
                              if (!buttonPanel.panel?.status) {
                                closeAllPanels();

                                buttonPanel.panel?.open();
                              } else {
                                closeAllPanels();
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
            }
          )}
        </div>
        <Divider grow={true} />
        <Version drawerStatus={drawerStatus} />
      </Drawer>
      {/* <Panel {...DefaultPanel.panel} /> */}
      {Object.keys(api.map(mapId).appBarButtons.buttons).map(
        (groupName: string) => {
          // get button panels from group
          const buttonPanels = api.map(mapId).appBarButtons.buttons[groupName];

          // display the panels in the list
          return (
            <div key={groupName}>
              {Object.keys(buttonPanels).map((buttonId) => {
                const buttonPanel = buttonPanels[buttonId];

                return buttonPanel?.panel ? (
                  <Panel key={buttonPanel.button.id} {...buttonPanel.panel} />
                ) : null;
              })}
            </div>
          );
        }
      )}
    </div>
  );
}

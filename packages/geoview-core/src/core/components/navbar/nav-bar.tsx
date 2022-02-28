/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef, useState } from "react";

import { DomEvent } from "leaflet";
import { useMap } from "react-leaflet";

import { useTranslation } from "react-i18next";

import makeStyles from "@mui/styles/makeStyles";

import ZoomIn from "./buttons/zoom-in";
import ZoomOut from "./buttons/zoom-out";
import Fullscreen from "./buttons/fullscreen";
import Home from "./buttons/home";

import { LEAFLET_POSITION_CLASSES } from "../../../geo/utils/constant";
import { api } from "../../../api/api";
import { EVENT_NAMES } from "../../../api/event";

import { Panel, ButtonGroup, Button } from "../../../ui";

import { Cast, TypeButtonPanel } from "../../types/cgpv-types";

const navBtnWidth = "32px";
const navBtnHeight = "32px";

const useStyles = makeStyles((theme) => ({
  navBarRef: {
    display: "flex",
    flexDirection: "row",
    marginRight: 5,
    marginBottom: 30,
    zIndex: theme.zIndex.appBar,
  },
  navBtnGroupContainer: {
    display: "flex",
    position: "relative",
    flexDirection: "column",
    pointerEvents: "auto",
  },
  navBtnGroup: {
    "&:not(:last-child)": {
      marginBottom: theme.spacing(2),
    },
    borderTopLeftRadius: theme.spacing(5),
    borderTopRightRadius: theme.spacing(5),
    borderBottomLeftRadius: theme.spacing(5),
    borderBottomRightRadius: theme.spacing(5),
  },
  navBarButton: {
    backgroundColor: "rgba(255,255,255,1)",
    color: theme.palette.primary.contrastText,
    borderRadius: theme.spacing(5),
    width: navBtnWidth,
    height: navBtnHeight,
    maxWidth: navBtnWidth,
    minWidth: navBtnWidth,
    padding: "initial",
    "&:hover": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.dark,
    },
  },
}));

/**
 * Create a navbar with buttons that can call functions or open custom panels
 */
export function NavBar(): JSX.Element {
  const [buttonPanelGroups, setButtonPanelGroups] = useState<
    Record<string, Record<string, TypeButtonPanel>>
  >({});

  const classes = useStyles();
  const { t } = useTranslation<string>();

  const navBarRef = useRef<HTMLDivElement>(null);

  const map = useMap();

  const mapId = api.mapInstance(map)!.id;

  const addButtonPanel = useCallback(
    (payload) => {
      const group = buttonPanelGroups[payload.groupName];

      setButtonPanelGroups({
        ...buttonPanelGroups,
        [payload.groupName]: {
          ...group,
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
   * listen to events to open/close the panel and to create the buttons
   */
  useEffect(() => {
    // disable events on container
    const navBarChildrenHTMLElements = Cast<HTMLElement[]>(
      navBarRef.current?.children
    );
    DomEvent.disableClickPropagation(navBarChildrenHTMLElements[0]);
    DomEvent.disableScrollPropagation(navBarChildrenHTMLElements[0]);
  }, []);

  useEffect(() => {
    // listen to new navbar panel creation
    api.event.on(
      EVENT_NAMES.EVENT_NAVBAR_BUTTON_PANEL_CREATE,
      (payload) => {
        if (payload && payload.handlerName && payload.handlerName === mapId) {
          addButtonPanel(payload);
        }
      },
      mapId
    );

    // listen to new navbar panel removal
    api.event.on(
      EVENT_NAMES.EVENT_NAVBAR_BUTTON_PANEL_REMOVE,
      (payload) => {
        if (payload && payload.handlerName && payload.handlerName === mapId) {
          removeButtonPanel(payload);
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.EVENT_NAVBAR_BUTTON_PANEL_CREATE, mapId);
      api.event.off(EVENT_NAMES.EVENT_NAVBAR_BUTTON_PANEL_REMOVE, mapId);
    };
  }, [addButtonPanel, removeButtonPanel]);

  /**
   * Close all open panels
   */
  const closeAllPanels = (): void => {
    Object.keys(buttonPanelGroups).map((groupName: string) => {
      // get button panels from group
      const buttonPanels = buttonPanelGroups[groupName];

      // get all button panels in each group
      Object.keys(buttonPanels).map((buttonId) => {
        const buttonPanel = buttonPanels[buttonId];

        buttonPanel.panel?.close();
      });
    });
  };

  return (
    <div
      ref={navBarRef}
      className={`${LEAFLET_POSITION_CLASSES.bottomright} ${classes.navBarRef}`}
    >
      {Object.keys(buttonPanelGroups).map((groupName) => {
        const buttons = buttonPanelGroups[groupName];

        // display the panels in the list
        const panels = Object.keys(buttons).map((buttonId) => {
          const buttonPanel = buttons[buttonId];

          return buttonPanel.panel ? (
            <Panel
              key={buttonPanel.button.id}
              button={buttonPanel.button}
              panel={buttonPanel.panel}
            />
          ) : null;
        });

        if (panels.length > 0) {
          return <div key={groupName}>{panels}</div>;
        }
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
                ariaLabel={t("mapnav.arianavbar")}
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
                        onClick={() => {
                          if (buttonPanel.button.callback)
                            buttonPanel.button.callback();
                        }}
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
                          if (buttonPanel.panel?.status) {
                            buttonPanel.panel?.close();
                          } else {
                            closeAllPanels();
                            buttonPanel.panel?.open();
                          }
                        }}
                      />
                    )
                  ) : null;
                })}
              </ButtonGroup>
            );
          }
        })}
        <ButtonGroup
          orientation="vertical"
          ariaLabel={t("mapnav.arianavbar")}
          variant="contained"
          className={classes.navBtnGroup}
        >
          <ZoomIn className={classes.navBarButton} />
          <ZoomOut className={classes.navBarButton} />
        </ButtonGroup>
        <ButtonGroup
          orientation="vertical"
          ariaLabel={t("mapnav.arianavbar", "")}
          variant="contained"
          className={classes.navBtnGroup}
        >
          <Fullscreen className={classes.navBarButton} />
          <Home className={classes.navBarButton} />
        </ButtonGroup>
      </div>
    </div>
  );
}

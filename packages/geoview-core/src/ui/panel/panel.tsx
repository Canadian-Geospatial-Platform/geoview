/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-nested-ternary */
import React, { useRef, useState, useEffect, useCallback } from "react";

import { DomEvent } from "leaflet";
import { useMap } from "react-leaflet";

import { useTranslation } from "react-i18next";

import makeStyles from "@mui/styles/makeStyles";

import { Card, CardHeader, CardContent } from "@mui/material";

import FocusTrap from "focus-trap-react";

import { Cast, TypePanelAppProps } from "../../core/types/cgpv-types";

import { api } from "../../api/api";
import { EVENT_NAMES } from "../../api/event";
import { HtmlToReact } from "../../core/containers/html-to-react";

import { IconButton, CloseIcon, Divider, Fade } from "..";

const useStyles = makeStyles((theme) => ({
  root: {
    minWidth: 300,
    width: 300,
    height: "100%",
    marginLeft: theme.spacing(2),
    borderRadius: 0,
    [theme.breakpoints.up("xl")]: {
      width: "auto !important",
      minWidth: 100,
    },
    [theme.breakpoints.down("sm")]: {
      width: "100%",
      minWidth: "100%",
    },
  },
  cardContainer: {
    height: "100%",
    overflow: "hidden",
    overflowY: "auto",
    paddingBottom: "10px !important",
    boxSizing: "border-box",
  },
  avatar: {
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(3, 7),
  },
  buttonIcon: {
    width: "1em",
    height: "1em",
    display: "inherit",
    fontSize: theme.typography.button?.fontSize,
    alignItems: "inherit",
    justifyContent: "inherit",
    transition: "fill 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    flexShrink: 0,
    userSelect: "none",
  },
}));

/**
 * Create a panel with a header title, icon and content
 * @param {TypePanelAppProps} props panel properties
 *
 * @returns {JSX.Element} the created Panel element
 */
export const Panel = (props: TypePanelAppProps): JSX.Element => {
  const { panel, button } = props;

  // set the active trap value for FocusTrap
  const [panelStatus, setPanelStatus] = useState(false);

  const [actionButtons, setActionButtons] = useState<
    JSX.Element[] & React.ReactNode[]
  >([]);
  const [, updatePanelContent] = useState(0);

  const classes = useStyles(props);
  const { t } = useTranslation<string>();

  const map = useMap();
  const mapId = api.mapInstance(map)!.id;

  const panelRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const PanelContent = (panel.content as React.ReactElement).type;

  /**
   * function that causes rerender when changing panel content
   */
  const updateComponent = useCallback(() => {
    updatePanelContent((count) => count + 1);
  }, []);

  /**
   * Close the panel
   */
  function closePanel(): void {
    // emit an event to hide the marker when using the details panel
    api.event.emit(EVENT_NAMES.EVENT_MARKER_ICON_HIDE, mapId, {});

    const buttonElement = document.getElementById(panel.buttonId);

    if (buttonElement) {
      // put back focus on calling button
      document.getElementById(panel.buttonId)?.focus();
    } else {
      const mapCont = map.getContainer();
      mapCont.focus();

      // if in focus trap mode, trigger the event
      if (mapCont.closest(".llwp-map")?.classList.contains("map-focus-trap")) {
        mapCont.classList.add("keyboard-focus");
        api.event.emit(
          EVENT_NAMES.EVENT_MAP_IN_KEYFOCUS,
          `leaflet-map-${mapId}`,
          {}
        );
      }
    }

    setPanelStatus(false);
  }

  useEffect(() => {
    // disable events on container
    DomEvent.disableClickPropagation(panelRef.current as HTMLElement);
    DomEvent.disableScrollPropagation(panelRef.current as HTMLElement);

    // if the panel was still open on reload then close it
    if (panel.status) {
      setPanelStatus(true);
    }

    // listen to open panel to activate focus trap and focus on close
    api.event.on(
      EVENT_NAMES.EVENT_PANEL_OPEN,
      (args) => {
        if (args.buttonId === panel.buttonId && args.handlerId === mapId) {
          // set focus on close button on panel open
          setTimeout(() => {
            setPanelStatus(true);

            if (closeBtnRef && closeBtnRef.current) {
              Cast<HTMLElement>(closeBtnRef.current).focus();
            }
          }, 0);
        }
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.EVENT_PANEL_CLOSE,
      (args) => {
        if (args.buttonId === panel.buttonId && args.handlerId === mapId)
          closePanel();
      },
      mapId
    );

    // listen to add action button event
    api.event.on(
      EVENT_NAMES.EVENT_PANEL_ADD_ACTION,
      (args) => {
        if (args.buttonId === panel.buttonId) {
          const { actionButton } = args;

          setActionButtons((prev) => [
            ...prev,
            <IconButton
              key={actionButton.id}
              tooltip={actionButton.title}
              tooltipPlacement="right"
              id={actionButton.id}
              ariaLabel={actionButton.title}
              onClick={actionButton.action}
              size="large"
            >
              {typeof actionButton.icon === "string" ? (
                <HtmlToReact
                  style={{
                    display: "flex",
                  }}
                  htmlContent={actionButton.icon}
                />
              ) : typeof actionButton.icon === "object" ? (
                actionButton.icon
              ) : (
                <actionButton.icon />
              )}
            </IconButton>,
          ]);
        }
      },
      mapId
    );

    // listen to remove action button event
    api.event.on(
      EVENT_NAMES.EVENT_PANEL_REMOVE_ACTION,
      (args) => {
        if (args.buttonId === panel.buttonId) {
          const { actionButtonId } = args;
          setActionButtons((list) =>
            list.filter((item) => {
              return item.props.id !== actionButtonId;
            })
          );
        }
      },
      mapId
    );

    // listen to change panel content and rerender
    api.event.on(
      EVENT_NAMES.EVENT_PANEL_CHANGE_CONTENT,
      (args) => {
        // set focus on close button on panel content change
        setTimeout(() => {
          if (closeBtnRef && closeBtnRef.current)
            Cast<HTMLElement>(closeBtnRef.current).focus();
        }, 100);

        if (args.buttonId === panel.buttonId) {
          updateComponent();
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.EVENT_PANEL_OPEN, mapId);
      api.event.off(EVENT_NAMES.EVENT_PANEL_CLOSE, mapId);
      api.event.off(EVENT_NAMES.EVENT_PANEL_ADD_ACTION, mapId);
      api.event.off(EVENT_NAMES.EVENT_PANEL_REMOVE_ACTION, mapId);
      api.event.off(EVENT_NAMES.EVENT_PANEL_CHANGE_CONTENT, mapId);
    };
  }, []);

  useEffect(() => {
    // set focus on close button on panel open
    if (closeBtnRef && closeBtnRef.current)
      if (button.visible) Cast<HTMLElement>(closeBtnRef.current).focus();
  }, [button, closeBtnRef]);

  return (
    <FocusTrap
      active={panelStatus}
      focusTrapOptions={{
        escapeDeactivates: false,
        clickOutsideDeactivates: true,
      }}
    >
      <Card
        ref={panelRef as React.MutableRefObject<null>}
        className={`leaflet-control ${classes.root}`}
        style={{
          display: panelStatus ? "block" : "none",
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            closePanel();
          }
        }}
        {...{ "data-id": panel.buttonId }}
      >
        <CardHeader
          className={classes.avatar}
          avatar={
            typeof panel.icon === "string" ? (
              <HtmlToReact
                className={classes.buttonIcon}
                htmlContent={panel.icon}
              />
            ) : typeof panel.icon === "object" ? (
              <panel.icon />
            ) : (
              <panel.icon />
            )
          }
          title={t(panel.title)}
          action={
            <>
              {actionButtons}
              <IconButton
                tooltip={t("general.close")}
                tooltipPlacement="right"
                className="cgpv-panel-close"
                ariaLabel={t("general.close")}
                size="large"
                onClick={closePanel}
                iconRef={closeBtnRef}
              >
                <CloseIcon />
              </IconButton>
            </>
          }
        />
        <Divider />
        <CardContent className={classes.cardContainer}>
          {typeof panel.content === "string" ? (
            <HtmlToReact htmlContent={panel.content} />
          ) : typeof panel.content === "object" ? (
            panel.content
          ) : (
            <panel.content />
          )}
        </CardContent>
      </Card>
    </FocusTrap>
  );
};

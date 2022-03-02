import React, { useState, useEffect, useRef, useContext } from "react";

import { useTranslation } from "react-i18next";

import FocusTrap from "focus-trap-react";

import { DomEvent } from "leaflet";

import makeStyles from "@mui/styles/makeStyles";
import { Card, CardContent, CardHeader, Divider } from "@mui/material";

import { CloseIcon, IconButton } from "..";

import { MapContext } from "../../core/app-start";
import { HtmlToReact } from "../../core/containers/html-to-react";
import {
  TypePanelProps,
  TypeMapConfigProps,
  TypeChildren,
  Cast,
} from "../../core/types/cgpv-types";

import { api } from "../../api/api";
import { EVENT_NAMES } from "../../api/event";

const useStyles = makeStyles((theme) => ({
  panelContainer: {
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

export const Panel = (props: TypePanelProps): JSX.Element => {
  const { title, icon, content, status, type, width, buttonId } = props;

  const mapConfig = useContext(MapContext) as TypeMapConfigProps;

  // panel props
  const [panelTitle, setPanelTitle] = useState<string | undefined>();
  const [panelContent, setPanelContent] = useState<React.ReactNode | Element>();
  const [panelIcon, setPanelIcon] = useState<React.ReactNode | Element>();
  const [panelStatus, setPanelStatus] = useState<boolean | undefined>(false);
  const [panelType, setPanelType] = useState<"appbar" | "navbar">();
  const [panelWidth, setPanelWidth] = useState<string | number>();

  const panelRef = useRef<HTMLButtonElement>(null);
  const panelHeader = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const classes = useStyles();

  const { t } = useTranslation();

  const closePanel = (): void => {
    setPanelStatus(false);
  };

  const Icon = icon ? (icon as React.ReactElement).type : <></>;

  const map = api.map(mapConfig.id!).map;

  useEffect(() => {
    if (panelRef && panelRef.current) {
      // disable events on container
      DomEvent.disableClickPropagation(panelHeader.current as HTMLElement);
      DomEvent.disableScrollPropagation(panelRef.current as HTMLElement);
      panelRef.current.onmouseenter = (e) => map.dragging.disable();
      panelRef.current.onmouseleave = (e) => map.dragging.enable();
    }

    // listen to open panel to activate focus trap and focus on close
    api.event.on(
      EVENT_NAMES.EVENT_PANEL_OPEN,
      (args) => {
        if (args.handlerName === mapConfig.id && args.buttonId === buttonId) {
          // set focus on close button on panel open
          setTimeout(() => {
            setPanelStatus(true);

            if (closeBtnRef && closeBtnRef.current) {
              Cast<HTMLElement>(closeBtnRef.current).focus();
            }
          }, 0);
        }
      },
      mapConfig.id
    );

    api.event.on(
      EVENT_NAMES.EVENT_PANEL_CLOSE,
      (args) => {
        if (args.handlerName === mapConfig.id && args.buttonId === buttonId)
          closePanel();
      },
      mapConfig.id
    );

    api.event.on(
      EVENT_NAMES.EVENT_PANEL_CHANGE_CONTENT,
      (args) => {
        console.log(buttonId);

        if (args.handlerName === mapConfig.id && args.buttonId === buttonId) {
          setPanelContent(args.content);
        }
      },
      mapConfig.id
    );

    api.event.on(
      EVENT_NAMES.EVENT_PANEL_UPDATE,
      (args) => {
        if (args.handlerName === mapConfig.id && args.buttonId === buttonId) {
          console.log("update");
          const panelProps = args.panelProps as TypePanelProps;

          setPanelContent(panelProps.content);
          setPanelTitle(panelProps.title);
          setPanelWidth(panelProps.width);
          setPanelType(panelProps.type);
          setPanelStatus(panelProps.status);
          setPanelIcon(panelProps.icon);
        }
      },
      mapConfig.id
    );

    return () => {
      api.event.off(EVENT_NAMES.EVENT_PANEL_OPEN, mapConfig.id);
      api.event.off(EVENT_NAMES.EVENT_PANEL_CLOSE, mapConfig.id);
      api.event.off(EVENT_NAMES.EVENT_PANEL_CHANGE_CONTENT, mapConfig.id);
      api.event.off(EVENT_NAMES.EVENT_PANEL_UPDATE, mapConfig.id);
    };
  }, []);

  let PanelContent = null;
  if (panelContent && (panelContent as React.ReactElement).type) {
    PanelContent = (panelContent as React.ReactElement).type;
  }

  let PanelIcon = null;
  if (panelIcon && (panelIcon as React.ReactElement).type) {
    PanelIcon = (panelIcon as React.ReactElement).type;
  }

  return (
    <FocusTrap
      active={panelStatus || status}
      focusTrapOptions={{
        escapeDeactivates: false,
        clickOutsideDeactivates: true,
      }}
    >
      <Card
        ref={panelRef as React.MutableRefObject<null>}
        className={`leaflet-control ${classes.panelContainer}`}
        style={{
          display: panelStatus || status ? "block" : "none",
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            closePanel();
          }
        }}
        // {...{ "data-id": button.id }}
      >
        <CardHeader
          className={classes.avatar}
          ref={panelHeader}
          avatar={
            panelIcon ? (
              typeof panelIcon === "string" ? (
                <HtmlToReact
                  className={classes.buttonIcon}
                  htmlContent={panelIcon}
                />
              ) : typeof panelIcon === "object" ? (
                <PanelIcon />
              ) : (
                <PanelIcon />
              )
            ) : typeof icon === "string" ? (
              <HtmlToReact className={classes.buttonIcon} htmlContent={icon} />
            ) : typeof icon === "object" ? (
              <Icon />
            ) : (
              <Icon />
            )
          }
          title={panelTitle ? t(panelTitle) : title ? t(title) : ""}
          action={
            (panelStatus || status) && (
              <>
                {/* {actionButtons} */}
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
            )
          }
        />
        <Divider />
        <CardContent className={classes.cardContainer}>
          {panelContent ? (
            typeof panelContent === "string" ? (
              <HtmlToReact htmlContent={panelContent} />
            ) : typeof panelContent === "object" ? (
              panelContent
            ) : (
              <PanelContent />
            )
          ) : typeof content === "string" ? (
            <HtmlToReact htmlContent={content} />
          ) : typeof content === "object" ? (
            content
          ) : (
            <content />
          )}
        </CardContent>
      </Card>
    </FocusTrap>
  );
};

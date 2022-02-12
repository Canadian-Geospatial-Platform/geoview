import { CSSProperties, useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { useMap } from "react-leaflet";

import makeStyles from '@mui/styles/makeStyles';
import { Drawer as MaterialDrawer } from "@mui/material";

import { api } from "../../api/api";
import { EVENT_NAMES } from "../../api/event";

import { IconButton, ChevronLeftIcon, ChevronRightIcon } from "..";

const drawerWidth = 200;
const useStyles = makeStyles((theme) => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    "& $toolbar": {
      justifyContent: "flex-end",
    },
  },
  drawerClose: {
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: "hidden",
    width: "61px",
    "& $toolbar": {
      justifyContent: "center",
    },
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(0, 1),
  },
}));

/**
 * Drawer Properties
 */
interface DrawerProps {
  variant?: "permanent" | "persistent" | "temporary" | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  status?: boolean;
  children?: JSX.Element | JSX.Element[];
}

/**
 * Create a customized Material UI Drawer
 *
 * @param {DrawerProps} props the properties passed to the Drawer element
 * @returns {JSX.Element} the created Drawer element
 */
export const Drawer = (props: DrawerProps): JSX.Element => {
  const { variant, status, className, style, children } = props;

  const [open, setOpen] = useState(false);

  const { t } = useTranslation<string>();

  const classes = useStyles();

  const map = useMap();

  const mapId = api.mapInstance(map).id;

  const openCloseDrawer = (status: boolean): void => {
    setOpen(status);

    // if appbar is open then close it
    api.event.emit(EVENT_NAMES.EVENT_DRAWER_OPEN_CLOSE, mapId, {
      status: status,
    });

    // if panel is open then close it
    // if (panelOpen) openClosePanel(false);
    // use an event to close the panel instead of calling a function
  };

  useEffect(() => {
    // set status from props if passed in
    if (status !== undefined) {
      setOpen(status);
    }

    // listen to drawer open/close events
    api.event.on(
      EVENT_NAMES.EVENT_DRAWER_OPEN_CLOSE,
      (payload) => {
        if (payload && payload.handlerName === mapId) {
          setOpen(payload.status);
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.EVENT_DRAWER_OPEN_CLOSE);
    };
  }, []);

  return (
    <MaterialDrawer
      variant={variant ? variant : "permanent"}
      className={open ? classes.drawerOpen : classes.drawerClose}
      classes={{
        paper: className
          ? className
          : open
          ? classes.drawerOpen
          : classes.drawerClose,
      }}
      style={style ? style : undefined}
    >
      <div className={classes.toolbar}>
        <IconButton
          tooltip={open ? t("general.close") : t("general.open")}
          tooltipPlacement="right"
          onClick={() => {
            openCloseDrawer(!open);
          }}
          size="large">
          {!open ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </div>
      {children !== undefined && children}
    </MaterialDrawer>
  );
};

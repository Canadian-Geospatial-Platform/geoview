import { Cast } from "geoview-core";

import { MINIMAP_SIZE } from "./overview-map";

// access window object
const w = window as any;

// access the cgpv object from the window object
const cgpv = w["cgpv"];

// access the api calls
const { api, react, leaflet, ui, constants, useTranslation } = cgpv;

// get event names
const EVENT_NAMES = api.eventNames;

// get react functions
const { useState, useEffect, useRef } = react;

// get leaflet events
const { DomEvent } = leaflet;

// get available elements
const { IconButton, ChevronLeftIcon } = ui.elements;

// get leaflet positions
const { leafletPositionClasses } = constants;

const useStyles = ui.makeStyles((theme: any) => ({
  toggleBtn: {
    transform: "rotate(45deg)",
    color: theme.palette.primary.contrastText,
    zIndex: theme.zIndex.tooltip,
  },
  toggleBtnContainer: {
    zIndex: theme.zIndex.tooltip,
  },
  minimapOpen: {
    transform: "rotate(-45deg)",
  },
  minimapClosed: {
    transform: "rotate(135deg)",
  },
}));

/**
 * Interface for the minimap toggle properties
 */
interface MinimapToggleProps {
  parentId: string;
  minimap: L.Map;
}

/**
 * Create a toggle element to expand/collapse the overview map
 * @param {MinimapToggleProps} props toggle properties
 * @return {JSX.Element} the toggle control
 */
export const MinimapToggle = (props: MinimapToggleProps): JSX.Element => {
  const { parentId, minimap } = props;

  const divRef = useRef(null);

  const { t } = useTranslation();

  const [status, setStatus] = useState(true);

  const classes = useStyles();

  const theme = ui.useTheme();

  /**
   * Toggle overview map to show or hide it
   * @param e the event being triggered on click
   */
  function toggleMinimap(): void {
    setStatus(!status);

    if (status) {
      const buttonSize = theme.overrides?.button?.size;
      // decrease size of overview map to the size of the toggle btn
      minimap.getContainer().style.width = buttonSize.width as string;
      minimap.getContainer().style.height = buttonSize.height as string;
    } else {
      // restore the size of the overview map
      minimap.getContainer().style.width = MINIMAP_SIZE.width;
      minimap.getContainer().style.height = MINIMAP_SIZE.height;
    }

    // trigger a new event when overview map is toggled
    api.event.emit(EVENT_NAMES.EVENT_OVERVIEW_MAP_TOGGLE, parentId, {
      status,
    });
  }

  useEffect(() => {
    DomEvent.disableClickPropagation(Cast<HTMLElement>(divRef.current));
  }, []);

  return (
    <div
      ref={divRef}
      className={`${leafletPositionClasses.topright} ${classes.toggleBtnContainer}`}
    >
      <IconButton
        className={`leaflet-control ${classes.toggleBtn} ${
          !status ? classes.minimapOpen : classes.minimapClosed
        }`}
        style={{
          margin: `-${theme.spacing(3)}`,
          padding: 0,
          height: "initial",
          minWidth: "initial",
        }}
        aria-label={t("mapctrl.overviewmap.toggle")}
        onClick={toggleMinimap}
        size="large"
      >
        <ChevronLeftIcon />
      </IconButton>
    </div>
  );
};

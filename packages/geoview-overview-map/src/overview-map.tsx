import { Cast } from "geoview-core";

import { MinimapBounds } from "./minimap-bounds";
import { MinimapToggle } from "./minimap-toggle";

export const MINIMAP_SIZE = {
  width: "150px",
  height: "150px",
};

// get the window object
const w = window as any;

// access the cgpv object from the window object
const cgpv = w["cgpv"];

// access the api calls
const { api, react, leaflet, reactLeaflet, ui, constants } = cgpv;

const { useState, useEffect, useRef, useMemo } = react;

const { DomEvent } = leaflet;

const { MapContainer, TileLayer, useMap } = reactLeaflet;

const { useMediaQuery, useTheme, makeStyles } = ui;

const { leafletPositionClasses } = constants;

const useStyles = makeStyles((theme: any) => ({
  minimap: {
    width: MINIMAP_SIZE.width,
    height: MINIMAP_SIZE.height,
    "-webkit-transition": "300ms linear",
    "-moz-transition": "300ms linear",
    "-o-transition": "300ms linear",
    "-ms-transition": "300ms linear",
    transition: "300ms linear",
    "&::before": {
      content: '""',
      display: "block",
      position: "absolute",
      width: 0,
      height: 0,
      borderTop: "32px solid hsla(0,0%,98%,0.9)",
      borderLeft: "32px solid transparent",
      zIndex: theme.zIndex.appBar,
      right: 0,
      top: 0,
    },
  },
}));

/**
 * Interface for overview map properties
 */
interface OverviewProps {
  id: string;
  crs: Object;
  language: string;
  zoomFactor: number;
}

/**
 * Create the overview map component
 * @param {OverviewProps} props the overview map properties
 * @return {JSX.Element} the overview map component
 */
export function OverviewMap(props: OverviewProps): JSX.Element {
  const { id, crs, zoomFactor } = props;

  const [minimap, setMinimap] = useState();

  const classes = useStyles();

  const theme = useTheme();

  // if screen size is medium and up
  const deviceSizeMedUp = useMediaQuery(theme.breakpoints.up("md"));

  const parentMap = useMap();
  const mapZoom =
    parentMap.getZoom() - zoomFactor > 0 ? parentMap.getZoom() - zoomFactor : 0;

  const basemaps = api.map(id).basemap.getBasemapLayers();

  const overviewRef = useRef(null);

  useEffect(() => {
    // disable events on container
    const overviewHTMLElement = Cast<HTMLElement>(overviewRef.current);
    if (overviewHTMLElement) {
      DomEvent.disableClickPropagation(overviewHTMLElement);
      DomEvent.disableScrollPropagation(overviewHTMLElement);
    }

    // remove ability to tab to the overview map
    // overviewHTMLElement.children[0].setAttribute("tabIndex", "-1");
  }, []);

  // Memorize the minimap so it's not affected by position changes
  const minimapContainer = useMemo(
    () => (
      <MapContainer
        // tabIndex={-1}
        className={classes.minimap}
        center={parentMap.getCenter()}
        zoom={mapZoom}
        crs={crs}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        attributionControl={false}
        zoomControl={false}
        whenCreated={(cgpMap: L.Map) => {
          const cgpMapContainer = cgpMap.getContainer();
          DomEvent.disableClickPropagation(cgpMapContainer);
          DomEvent.disableScrollPropagation(cgpMapContainer);
          const cgpMapContainerParentElement =
            cgpMapContainer.parentElement as HTMLElement;
          cgpMapContainerParentElement.style.margin = theme.spacing(3);

          setMinimap(cgpMap);
        }}
      >
        {minimap ? (
          <>
            {basemaps.map(
              (base: {
                id: string | number | null | undefined;
                url: string;
              }) => (
                <TileLayer key={base.id} url={base.url} />
              )
            )}
            <MinimapBounds
              parentId={id}
              parentMap={parentMap}
              minimap={minimap}
              zoomFactor={zoomFactor}
            />
            <MinimapToggle parentId={id} minimap={minimap} />
          </>
        ) : (
          <></>
        )}
      </MapContainer>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parentMap, crs, mapZoom, basemaps, zoomFactor, minimap]
  );

  return deviceSizeMedUp ? (
    <div className={leafletPositionClasses.topright}>
      <div ref={overviewRef} className="leaflet-control leaflet-bar">
        {minimapContainer}
      </div>
    </div>
  ) : (
    <></>
  );
}

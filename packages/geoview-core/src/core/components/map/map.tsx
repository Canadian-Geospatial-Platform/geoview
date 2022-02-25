/* eslint-disable react/require-default-props */
import { Fragment, useEffect, useState } from "react";

import { CRS } from "leaflet";
import { MapContainer, TileLayer, ScaleControl } from "react-leaflet";

import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import makeStyles from "@mui/styles/makeStyles";

import { SnackbarProvider } from "notistack";

import { Crosshair } from "../crosshair/crosshair";
import { MousePosition } from "../mouse-position/mouse-position";
import { OverviewMap } from "../overview-map/overview-map";
import { Attribution } from "../attribution/attribution";
import { Snackbar } from "../../../ui/snackbar/snackbar";
import { Appbar } from "../appbar/app-bar";
import { NavBar } from "../navbar/nav-bar";
import { NorthArrow, NorthPoleFlag } from "../north-arrow/north-arrow";
import { ClickMarker } from "../click-marker/click-marker";

import { generateId } from "../../utils/utilities";

import { api } from "../../../api/api";
import { EVENT_NAMES } from "../../../api/event";

import { MapViewer } from "../../../geo/map/map";

import {
  TypeMapConfigProps,
  TypeBasemapLayer,
  TypeJSONObjectMapComponent,
} from "../../types/cgpv-types";

const useStyles = makeStyles((theme) => ({
  snackBar: {
    "& .MuiButton-text": { color: theme.palette.primary.light },
  },
}));

export function Map(props: TypeMapConfigProps): JSX.Element {
  // make sure the id is not undefined
  // eslint-disable-next-line react/destructuring-assignment
  const id = props.id ? props.id : generateId("");

  const { center, zoom, projection, language, selectBox, boxZoom, plugins } =
    props;

  const [basemapLayers, setBasemapLayers] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // projection crs
  const [crs, setCRS] = useState<CRS>();

  // attribution used by the map
  const [attribution, setAttribution] = useState<string>("");

  // render additional components if added by api
  const [components, setComponents] = useState<TypeJSONObjectMapComponent>({});

  const defaultTheme = useTheme();
  const classes = useStyles();

  // create a new map viewer instance
  let viewer: MapViewer = api.map(id);

  // if screen size is medium and up
  const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up("md"));

  // get map option from selected basemap projection
  const mapOptions: L.MapOptions = viewer.getMapOptions(projection);

  /**
   * Get the center position of the map when move / drag has ended
   * then emit it as an api event
   * @param event Move end event container a reference to the map
   */
  function mapMoveEnd(event: L.LeafletEvent): void {
    // get a map reference from the moveend event
    const map: L.Map = event.target;

    const position = map.getCenter();

    api.map(id).currentPosition = position;

    // emit the moveend event to the api
    api.event.emit(EVENT_NAMES.EVENT_MAP_MOVE_END, id, {
      position: position,
    });
  }

  /**
   * Get the zoom level of the map when zoom in / out has ended
   * then emit it as an api event
   * @param event Zoom end event container a reference to the map
   */
  function mapZoomEnd(event: L.LeafletEvent): void {
    // get a map reference from the zoomend event
    const map: L.Map = event.target;

    const zoom = map.getZoom();

    api.map(id).currentZoom = zoom;

    // emit the moveend event to the api
    api.event.emit(EVENT_NAMES.EVENT_MAP_ZOOM_END, id, {
      zoom: zoom,
    });
  }

  useEffect(() => {
    // listen to adding a new component events
    api.event.on(
      EVENT_NAMES.EVENT_MAP_ADD_COMPONENT,
      (payload) => {
        if (payload && payload.handlerName === id)
          setComponents((tempComponents) => ({
            ...tempComponents,
            [payload.id]: payload.component,
          }));
      },
      id
    );

    // listen to removing a component events
    api.event.on(
      EVENT_NAMES.EVENT_MAP_REMOVE_COMPONENT,
      (payload) => {
        if (payload && payload.handlerName === id) {
          let tempComponents = { ...components };
          delete tempComponents[payload.id];

          setComponents((components) => ({
            ...tempComponents,
          }));
        }
      },
      id
    );

    // listen to adding a new basemap events
    api.event.on(
      EVENT_NAMES.EVENT_BASEMAP_LAYERS_UPDATE,
      (payload) => {
        if (payload && payload.handlerName === id)
          setBasemapLayers(payload.layers);
      },
      id
    );

    return () => {
      api.event.off(EVENT_NAMES.EVENT_BASEMAP_LAYERS_UPDATE, id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MapContainer
      id={id}
      center={center}
      zoom={zoom}
      crs={api.projection.getProjection(projection)}
      zoomControl={false}
      selectBox={selectBox}
      boxZoom={boxZoom}
      attributionControl={false}
      minZoom={mapOptions.minZoom}
      maxZoom={mapOptions.maxZoom}
      maxBounds={mapOptions.maxBounds}
      keyboardPanDelta={20}
      whenCreated={(cgpMap: L.Map) => {
        // eslint-disable-next-line no-param-reassign
        cgpMap.id = id;

        // add a class to map container to easely find the container
        cgpMap.getContainer().classList.add(`leaflet-map-${id}`);

        // reset the view when created so overview map is moved at the right place
        cgpMap.setView(center, zoom);

        // emit the initial map position
        api.event.emit(EVENT_NAMES.EVENT_MAP_MOVE_END, id || "", {
          position: cgpMap.getCenter(),
        });

        // listen to map move end events
        cgpMap.on("moveend", mapMoveEnd);

        // listen to map zoom end events
        cgpMap.on("zoomend", mapZoomEnd);

        // initialize the map viewer and load plugins
        viewer.initMap(cgpMap);

        // get crs
        setCRS(viewer.projection.getCRS());

        // get attribution
        setAttribution(
          language === "en-CA"
            ? viewer.basemap.attribution["en-CA"]
            : viewer.basemap.attribution["fr-CA"]
        );

        // call the ready function since rendering of this map instance is done
        api.ready(() => {
          // load plugins once all maps has rendered
          api.plugin.loadPlugins(id, plugins);
        });

        // emit the map loaded event
        setIsLoaded(true);
        api.event.emit(EVENT_NAMES.EVENT_MAP_LOADED, id, { map: cgpMap });
      }}
    >
      {isLoaded && (
        <>
          {basemapLayers.map((basemapLayer: TypeBasemapLayer) => {
            return (
              <TileLayer
                key={basemapLayer.id}
                url={basemapLayer.url}
                attribution={attribution}
                opacity={basemapLayer.opacity}
                pane={basemapLayer.basemapPaneName}
              />
            );
          })}
          {deviceSizeMedUp && <MousePosition id={id} />}
          <ScaleControl position="bottomright" imperial={false} />
          {deviceSizeMedUp && <Attribution attribution={attribution} />}
          <div
            className="leaflet-control cgp-appbar"
            style={{
              boxSizing: "content-box",
              zIndex: defaultTheme.zIndex.appBar,
            }}
          >
            <Appbar />
          </div>
          {deviceSizeMedUp && (
            <OverviewMap
              id={id}
              crs={crs!}
              language={language}
              zoomFactor={mapOptions.zoomFactor as number}
            />
          )}
          <NorthArrow projection={crs!} />
          <NorthPoleFlag projection={crs!} />
          <Crosshair id={id} />
          <ClickMarker />
          <NavBar />
          <SnackbarProvider
            maxSnack={3}
            dense
            autoHideDuration={4000}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            className={`${classes.snackBar}`}
          >
            <Snackbar id={id} />
          </SnackbarProvider>
          {Object.keys(components).map((key: string) => {
            return <Fragment key={key}>{components[key]}</Fragment>;
          })}
        </>
      )}
    </MapContainer>
  );
}

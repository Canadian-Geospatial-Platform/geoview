/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState } from 'react';

import { CRS } from 'leaflet';
import { MapContainer, TileLayer, ScaleControl } from 'react-leaflet';

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Crosshair } from '../crosshair/crosshair';
import { MousePosition } from '../mouse-position/mouse-position';
import { Attribution } from '../attribution/attribution';
import { NorthArrow, NorthPoleFlag } from '../north-arrow/north-arrow';
import { ClickMarker } from '../click-marker/click-marker';

import { generateId } from '../../utils/utilities';

import { api } from '../../../api/api';
import { EVENT_NAMES } from '../../../api/event';

import { MapViewer } from '../../../geo/map/map';

import { Cast, TypeMapConfigProps, TypeBasemapLayer, TypeJsonString } from '../../types/cgpv-types';

export function Map(props: TypeMapConfigProps): JSX.Element {
  const { map: mapProps, extraOptions, language } = props;

  // make sure the id is not undefined
  // eslint-disable-next-line react/destructuring-assignment
  const id = props.id ? props.id : generateId('');

  const [basemapLayers, setBasemapLayers] = useState<TypeBasemapLayer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // projection crs
  const [crs, setCRS] = useState<CRS>();

  // attribution used by the map
  const [attribution, setAttribution] = useState<string>('');

  const defaultTheme = useTheme();

  // create a new map viewer instance
  const viewer: MapViewer = api.map(id);

  // if screen size is medium and up
  const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('md'));

  // get map option from selected basemap projection
  const mapOptions: L.MapOptions = viewer.getMapOptions(mapProps.projection);

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
      position,
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

    const currentZoom = map.getZoom();

    api.map(id).currentZoom = currentZoom;

    // emit the moveend event to the api
    api.event.emit(EVENT_NAMES.EVENT_MAP_ZOOM_END, id, {
      currentZoom,
    });
  }

  useEffect(() => {
    // listen to adding a new basemap events
    api.event.on(
      EVENT_NAMES.EVENT_BASEMAP_LAYERS_UPDATE,
      (payload) => {
        if (payload && (payload.handlerName as TypeJsonString) === id) setBasemapLayers(Cast<TypeBasemapLayer[]>(payload.layers));
      },
      id
    );

    return () => {
      api.event.off(EVENT_NAMES.EVENT_BASEMAP_LAYERS_UPDATE, id);
    };
  }, [id]);

  return (
    <MapContainer
      id={id}
      center={mapProps.initialView.center}
      zoom={mapProps.initialView.zoom}
      crs={api.projection.getProjection(mapProps.projection)}
      zoomControl={false}
      selectBox={mapProps.controls?.selectBox}
      boxZoom={mapProps.controls?.boxZoom}
      attributionControl={false}
      minZoom={mapOptions.minZoom}
      maxZoom={mapOptions.maxZoom}
      maxBounds={mapOptions.maxBounds}
      keyboardPanDelta={20}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...extraOptions}
      whenCreated={(cgpMap: L.Map) => {
        // eslint-disable-next-line no-param-reassign
        cgpMap.id = id;

        // add a class to map container to easely find the container
        cgpMap.getContainer().classList.add(`leaflet-map-${id}`);

        // reset the view when created so overview map is moved at the right place
        cgpMap.setView(mapProps.initialView.center, mapProps.initialView.zoom);

        // emit the initial map position
        api.event.emit(EVENT_NAMES.EVENT_MAP_MOVE_END, id || '', {
          position: cgpMap.getCenter(),
        });

        // listen to map move end events
        cgpMap.on('moveend', mapMoveEnd);

        // listen to map zoom end events
        cgpMap.on('zoomend', mapZoomEnd);

        // initialize the map viewer and load plugins
        viewer.initMap(cgpMap);

        // get crs
        setCRS(viewer.projection.getCRS());

        // get attribution
        setAttribution(language === 'en-CA' ? viewer.basemap.attribution['en-CA'] : viewer.basemap.attribution['fr-CA']);

        // call the ready function since rendering of this map instance is done
        api.ready(() => {
          // load plugins once all maps has rendered
          api.plugin.loadPlugins();
        });

        // emit the map loaded event
        setIsLoaded(true);
      }}
    >
      {isLoaded && crs && (
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
          <NorthArrow projection={crs} />
          <NorthPoleFlag projection={crs} />
          <Crosshair id={id} />
          <ClickMarker />
        </>
      )}
    </MapContainer>
  );
}

/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState } from 'react';

import { CRS } from 'leaflet';
import { MapContainer, TileLayer } from 'react-leaflet';

import makeStyles from '@mui/styles/makeStyles';

import { Crosshair } from '../crosshair/crosshair';
import { NorthArrow, NorthPoleFlag } from '../north-arrow/north-arrow';
import { ClickMarker } from '../click-marker/click-marker';

import { generateId } from '../../utils/utilities';

import { api } from '../../../app';
import { EVENT_NAMES } from '../../../api/events/event';

import { MapViewer } from '../../../geo/map/map';

import { TypeMapConfigProps, TypeBasemapLayer } from '../../types/cgpv-types';
import { payloadIsABasemapLayerArray } from '../../../api/events/payloads/basemap-layers-payload';
import { numberPayload } from '../../../api/events/payloads/number-payload';
import { latLngPayload } from '../../../api/events/payloads/lat-long-payload';
import { attributionPayload } from '../../../api/events/payloads/attribution-payload';
import { Footerbar } from '../footerbar/footer-bar';

export const useStyles = makeStyles(() => ({
  mapContainer: {
    width: '100%',
  },
}));

export function Map(props: TypeMapConfigProps): JSX.Element {
  const { map: mapProps, extraOptions, language, components } = props;

  // make sure the id is not undefined
  // eslint-disable-next-line react/destructuring-assignment
  const id = props.id ? props.id : generateId('');

  const [basemapLayers, setBasemapLayers] = useState<TypeBasemapLayer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const classes = useStyles();

  // projection crs
  const [crs, setCRS] = useState<CRS>();

  // attribution used by the map
  const [attribution, setAttribution] = useState<string>('');

  // create a new map viewer instance
  const viewer: MapViewer = api.map(id);

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
    api.event.emit(latLngPayload(EVENT_NAMES.MAP.EVENT_MAP_MOVE_END, id, position));
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
    api.event.emit(numberPayload(EVENT_NAMES.MAP.EVENT_MAP_ZOOM_END, id, currentZoom));
  }

  useEffect(() => {
    // listen to adding a new basemap events
    api.event.on(
      EVENT_NAMES.BASEMAP.EVENT_BASEMAP_LAYERS_UPDATE,
      (payload) => {
        if (payloadIsABasemapLayerArray(payload)) {
          if (payload.handlerName === id) {
            // clear the layers then apply them
            // if not layers orders may be messed up
            setBasemapLayers([]);
            setTimeout(() => setBasemapLayers(payload.layers), 100);
          }
        }
      },
      id
    );

    return () => {
      api.map(id).map.off('moveend');
      api.map(id).map.off('zoomend');
      api.map(id).map.off('zoomanim');
      api.event.off(EVENT_NAMES.BASEMAP.EVENT_BASEMAP_LAYERS_UPDATE, id);
    };
  }, [id]);

  return (
    <MapContainer
      id={id}
      className={classes.mapContainer}
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
        api.event.emit(latLngPayload(EVENT_NAMES.MAP.EVENT_MAP_MOVE_END, id || '', cgpMap.getCenter()));

        // listen to map move end events
        cgpMap.on('moveend', mapMoveEnd);

        // listen to map zoom end events
        cgpMap.on('zoomend', mapZoomEnd);

        // initialize the map viewer and load plugins
        viewer.initMap(cgpMap);

        // get crs
        setCRS(viewer.projection.getCRS());

        // get attribution
        const attr = language === 'en-CA' ? viewer.basemap.attribution['en-CA'] : viewer.basemap.attribution['fr-CA'];

        setAttribution(attr);

        // emit attribution update to footerbar
        api.event.emit(attributionPayload(EVENT_NAMES.ATTRIBUTION.EVENT_ATTRIBUTION_UPDATE, id, attr));

        // call the ready function since rendering of this map instance is done
        api.ready(() => {
          // load plugins once all maps have rendered
          api.plugin.loadPlugins();
        });

        // emit the map loaded event
        setIsLoaded(true);

        viewer.toggleMapInteraction(mapProps.interaction);
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
          {components !== undefined && components.indexOf('northArrow') > -1 && <NorthArrow projection={crs} />}
          <NorthPoleFlag projection={crs} />
          <Crosshair id={id} />
          <ClickMarker />
          <Footerbar attribution={attribution} />
        </>
      )}
    </MapContainer>
  );
}

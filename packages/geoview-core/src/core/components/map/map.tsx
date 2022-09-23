/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useRef, MutableRefObject } from 'react';

import { fromLonLat, toLonLat } from 'ol/proj';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { ObjectEvent } from 'ol/Object';
import { Collection, MapEvent } from 'ol';
import BaseLayer from 'ol/layer/Base';
import Source from 'ol/source/Source';

import makeStyles from '@mui/styles/makeStyles';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { NorthArrow, NorthPoleFlag } from '../north-arrow/north-arrow';

import { generateId } from '../../utils/utilities';

import { api } from '../../../app';
import { EVENT_NAMES } from '../../../api/events/event-types';

import { MapViewer } from '../../../geo/map/map';

import { payloadIsABasemapLayerArray } from '../../../api/events/payloads/basemap-layers-payload';
import { payloadIsAMapViewProjection } from '../../../api/events/payloads/map-view-projection-payload';
import { numberPayload } from '../../../api/events/payloads/number-payload';
import { lngLatPayload } from '../../../api/events/payloads/lat-long-payload';
import { Footerbar } from '../footerbar/footer-bar';
import { OverviewMap } from '../overview-map/overview-map';
import { TypeMapFeaturesConfig } from '../../types/global-types';

const useStyles = makeStyles(() => ({
  mapContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    position: 'relative',
  },
}));

export function Map(mapFeaturesConfig: TypeMapFeaturesConfig): JSX.Element {
  const { map: mapConfig, components } = mapFeaturesConfig;

  // make sure the id is not undefined
  // eslint-disable-next-line react/destructuring-assignment
  const id = mapFeaturesConfig.mapId ? mapFeaturesConfig.mapId : generateId('');

  const [isLoaded, setIsLoaded] = useState(false);

  const classes = useStyles();

  // get ref to div element
  const mapElement = useRef<HTMLDivElement | null>();

  // create a new map viewer instance
  const viewer: MapViewer = api.map(id);

  const defaultTheme = useTheme();

  // if screen size is medium and up
  const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('md'));

  /**
   * Get the center position of the map when move / drag has ended
   * then emit it as an api event
   * @param {MapEvent} event Move end event container a reference to the map
   */
  function mapMoveEnd(event: MapEvent): void {
    // get a map reference from the moveend event
    const { map } = event;

    const position = map.getView().getCenter()!;

    api.map(id).currentPosition = position;

    // emit the moveend event to the api
    api.event.emit(lngLatPayload(EVENT_NAMES.MAP.EVENT_MAP_MOVE_END, id, position));
  }

  /**
   * Get the zoom level of the map when zoom in / out has ended
   * then emit it as an api event
   * @param {ObjectEvent} event Zoom end event container a reference to the map
   */
  function mapZoomEnd(event: ObjectEvent): void {
    const view: View = event.target;

    const currentZoom = view.getZoom()!;

    api.map(id).currentZoom = currentZoom;

    // emit the moveend event to the api
    api.event.emit(numberPayload(EVENT_NAMES.MAP.EVENT_MAP_ZOOM_END, id, currentZoom));
  }

  const initCGPVMap = (cgpvMap: OLMap) => {
    cgpvMap.set('id', id);

    // initialize the map viewer and load plugins
    viewer.initMap(cgpvMap);

    // call the ready function since rendering of this map instance is done
    api.ready(() => {
      // load plugins once all maps have rendered
      api.plugin.loadPlugins();
    });

    // emit the initial map position
    api.event.emit(lngLatPayload(EVENT_NAMES.MAP.EVENT_MAP_MOVE_END, id || '', cgpvMap.getView().getCenter()!));

    cgpvMap.on('moveend', mapMoveEnd);
    cgpvMap.getView().on('change:resolution', mapZoomEnd);

    viewer.toggleMapInteraction(mapConfig.interaction);

    // emit the map loaded event
    setIsLoaded(true);
  };

  const initMap = async () => {
    // create map
    const projection = api.projection.projections[mapConfig.viewSettings.projection];

    const defaultBasemap = await api.map(id).basemap.loadDefaultBasemaps();

    const initialMap = new OLMap({
      target: mapElement.current as string | HTMLElement | undefined,
      layers: defaultBasemap?.layers.map((layer) => {
        // create a tile layer for this basemap layer
        const tileLayer = new TileLayer({
          opacity: layer.opacity,
          source: layer.source,
        });

        // add this layer to the basemap group
        tileLayer.set('id', 'basemap');

        return tileLayer;
      }),
      view: new View({
        projection,
        center: fromLonLat([mapConfig.viewSettings.center[0], mapConfig.viewSettings.center[1]], projection),
        zoom: mapConfig.viewSettings.zoom,
        // TODO: is still valid? extent: projectionConfig.extent,
        extent: defaultBasemap?.defaultExtent ? defaultBasemap?.defaultExtent : undefined,
        minZoom: defaultBasemap?.zoomLevels.min || 0,
        maxZoom: defaultBasemap?.zoomLevels.max || 17,
      }),
      controls: [],
    });

    initCGPVMap(initialMap);
  };

  useEffect(() => {
    initMap();

    // listen to adding a new basemap events
    api.event.on(
      EVENT_NAMES.BASEMAP.EVENT_BASEMAP_LAYERS_UPDATE,
      (payload) => {
        if (payloadIsABasemapLayerArray(payload)) {
          if (payload.handlerName === id) {
            // remove previous basemaps
            const layers = api.map(id).map.getAllLayers();

            // loop through all layers on the map
            for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
              const layer = layers[layerIndex];

              // get group id that this layer belongs to
              const layerId = layer.get('id');

              // check if the group id matches basemap
              if (layerId && layerId === 'basemap') {
                // remove the basemap layer
                api.map(id).map.removeLayer(layer);
              }
            }

            // add basemap layers
            payload.layers.forEach((layer, index) => {
              const basemapLayer = new TileLayer({
                opacity: layer.opacity,
                source: layer.source,
              });

              // set this basemap's group id to basemap
              basemapLayer.set('id', 'basemap');

              // add the basemap layer
              api.map(id).map.getLayers().insertAt(index, basemapLayer);

              // render the layer
              basemapLayer.changed();
            });
          }
        }
      },
      id
    );

    // listen to geoview-basemap-panel package change projection event
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE,
      (payload) => {
        if (payloadIsAMapViewProjection(payload)) {
          if (payload.handlerName === id) {
            // on map view projection change, layer source needs to be refreshed
            const currentView = api.map(id).getView();
            const centerCoordinate = toLonLat(currentView.getCenter()!, currentView.getProjection());
            api.map(id).setView({
              projection: 3978,
              zoom: currentView.getZoom()!,
              center: [centerCoordinate[0], centerCoordinate[1]],
            });
            const mapLayers = api.map(id).layer.layers;
            Object.entries(mapLayers).forEach((mapLayerEntry) => {
              const refreshBaseLayer = (baseLayer: BaseLayer | null) => {
                if (baseLayer) {
                  const layerGroup: Array<BaseLayer> | Collection<BaseLayer> | undefined = baseLayer.get('layers');
                  if (layerGroup) {
                    layerGroup.forEach((baseLayerEntry) => {
                      refreshBaseLayer(baseLayerEntry);
                    });
                  } else {
                    const layerSource: Source = baseLayer.get('source');
                    layerSource.refresh();
                  }
                }
              };
              refreshBaseLayer(mapLayerEntry[1].gvLayers);
            });
          }
        }
      },
      id
    );

    return () => {
      api.event.off(EVENT_NAMES.BASEMAP.EVENT_BASEMAP_LAYERS_UPDATE, id);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id={id} ref={mapElement as MutableRefObject<HTMLDivElement | null>} className={classes.mapContainer}>
      {isLoaded && (
        <>
          {components !== undefined && components.indexOf('north-arrow') > -1 && (
            <NorthArrow projection={api.projection.projections[api.map(id).currentProjection].getCode()} />
          )}
          <NorthPoleFlag projection={api.projection.projections[api.map(id).currentProjection].getCode()} />
          {deviceSizeMedUp && components !== undefined && components.indexOf('overview-map') > -1 && <OverviewMap />}
          {deviceSizeMedUp && <Footerbar />}
        </>
      )}
    </div>
  );
}

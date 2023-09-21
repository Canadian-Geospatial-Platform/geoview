/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useRef, MutableRefObject } from 'react';

import { fromLonLat, toLonLat } from 'ol/proj';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { ObjectEvent } from 'ol/Object';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { Collection, MapEvent } from 'ol';
import BaseLayer from 'ol/layer/Base';
import Source from 'ol/source/Source';

import makeStyles from '@mui/styles/makeStyles';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Extent } from 'ol/extent';
import { NorthArrow, NorthPoleFlag } from '../north-arrow/north-arrow';
import { Crosshair } from '../crosshair/crosshair';
import { Footerbar } from '../footer-bar/footer-bar';
import { OverviewMap } from '../overview-map/overview-map';
import { ClickMarker } from '../click-marker/click-marker';
import { HoverTooltip } from '../hover-tooltip/hover-tooltip';

import { disableScrolling, generateId } from '../../utils/utilities';

import { TypeVectorSourceInitialConfig, api, inKeyfocusPayload, notificationPayload } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { MapViewer } from '@/geo/map/map';

import {
  payloadIsABasemapLayerArray,
  payloadIsAMapViewProjection,
  numberPayload,
  lngLatPayload,
  TypeMapMouseInfo,
  mapMouseEventPayload,
  PayloadBaseClass,
} from '@/api/events/payloads';
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
  const mapId = mapFeaturesConfig.mapId ? mapFeaturesConfig.mapId : generateId('');
  const {
    map: { interaction: mapInteraction },
  } = mapFeaturesConfig;
  const [isLoaded, setIsLoaded] = useState(false);

  const classes = useStyles();

  // get ref to div element
  const mapElement = useRef<HTMLDivElement | undefined>();

  // create a new map viewer instance
  const viewer: MapViewer = api.maps[mapId];

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

    api.maps[mapId].currentMapCenterPosition = position;

    // emit the moveend event to the api
    api.event.emit(lngLatPayload(EVENT_NAMES.MAP.EVENT_MAP_MOVE_END, mapId, position));
  }

  /**
   * Get the zoom level of the map when zoom in / out has ended
   * then emit it as an api event
   * @param {ObjectEvent} event Zoom end event container a reference to the map
   */
  function mapZoomEnd(event: ObjectEvent): void {
    const prevZoom = api.maps[mapId].currentZoom;
    const view: View = event.target;
    const currentZoom = view.getZoom()!;
    const layers = api.maps[mapId].layer.registeredLayers;

    api.maps[mapId].currentZoom = currentZoom;

    Object.keys(layers).forEach((layer) => {
      if (layer.endsWith('-unclustered')) {
        const clusterLayerId = layer.replace('-unclustered', '');
        const splitZoom =
          (api.maps[mapId].layer.registeredLayers[clusterLayerId].source as TypeVectorSourceInitialConfig)!.cluster!.splitZoom || 7;
        if (prevZoom < splitZoom && currentZoom >= splitZoom) {
          api.maps[mapId].layer.registeredLayers[clusterLayerId]?.gvLayer!.setVisible(false);
          api.maps[mapId].layer.registeredLayers[layer]?.gvLayer!.setVisible(true);
        }
        if (prevZoom >= splitZoom && currentZoom < splitZoom) {
          api.maps[mapId].layer.registeredLayers[clusterLayerId]?.gvLayer!.setVisible(true);
          api.maps[mapId].layer.registeredLayers[layer]?.gvLayer!.setVisible(false);
        }
      }
    });

    // emit the moveend event to the api
    api.event.emit(numberPayload(EVENT_NAMES.MAP.EVENT_MAP_ZOOM_END, mapId, currentZoom));
  }

  /**
   * Map single click handler
   * @param {MapEvent} event the map single click event
   */
  function mapSingleClick(event: MapEvent): void {
    if (mapInteraction !== 'static') {
      const coordinates: TypeMapMouseInfo = {
        projected: (event as MapBrowserEvent<UIEvent>).coordinate,
        pixel: (event as MapBrowserEvent<UIEvent>).pixel,
        lnglat: toLonLat((event as MapBrowserEvent<UIEvent>).coordinate, `EPSG:${api.maps[mapId].currentProjection}`),
        dragging: (event as MapBrowserEvent<UIEvent>).dragging,
      };

      api.maps[mapId].singleClickedPosition = coordinates;

      // emit the singleclick map position
      api.event.emit(mapMouseEventPayload(EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK, mapId, coordinates));
    }
  }

  /**
   * Map pointer move handler
   * @param {MapEvent} event the map pointer move event
   */
  function mapPointerMove(event: MapEvent): void {
    if (mapInteraction !== 'static') {
      const coordinates: TypeMapMouseInfo = {
        projected: (event as MapBrowserEvent<UIEvent>).coordinate,
        pixel: (event as MapBrowserEvent<UIEvent>).pixel,
        lnglat: toLonLat((event as MapBrowserEvent<UIEvent>).coordinate, `EPSG:${api.maps[mapId].currentProjection}`),
        dragging: (event as MapBrowserEvent<UIEvent>).dragging,
      };

      api.maps[mapId].pointerPosition = coordinates;

      // emit the pointer move map position
      api.event.emit(mapMouseEventPayload(EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE, mapId, coordinates));
    }
  }

  const initCGPVMap = (cgpvMap: OLMap) => {
    cgpvMap.set('mapId', mapId);

    // initialize the map viewer and load plugins
    viewer.initMap(cgpvMap);

    // call the ready function since rendering of this map instance is done
    api.ready(() => {
      // load plugins once all maps have rendered
      api.plugin.loadPlugins();
    });

    // TODO: when map is loaded from function call, there is a first init with the empty config then an overwrite by the the function call.
    // !Some of the reference are not set properly, so we have this work around. Even with this is it not 100% perfect. This needs to be refactor
    // !so we do not have access before the api map is set. Related to language as well #1118
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let intervalMap: any;
    const setMapEvents = () => {
      if (api.maps[mapId] !== undefined) {
        // emit the initial map position
        api.event.emit(lngLatPayload(EVENT_NAMES.MAP.EVENT_MAP_MOVE_END, mapId || '', cgpvMap.getView().getCenter()!));

        cgpvMap.on('moveend', mapMoveEnd);
        cgpvMap.on('singleclick', mapSingleClick);
        cgpvMap.on('pointermove', mapPointerMove);
        cgpvMap.getView().on('change:resolution', mapZoomEnd);

        clearInterval(intervalMap);
        intervalMap = null;
      }
    };
    intervalMap = setInterval(setMapEvents, 500);

    viewer.toggleMapInteraction(mapConfig.interaction);

    // emit the map loaded event
    setIsLoaded(true);
  };

  const initMap = async () => {
    // create map
    const projection = api.projection.projections[mapConfig.viewSettings.projection];

    const defaultBasemap = await api.maps[mapId].basemap.loadDefaultBasemaps();

    let extent: Extent | undefined;
    if (mapConfig.viewSettings?.extent) {
      if (projection.getCode() === 'EPSG:3978') {
        // eslint-disable-next-line no-console
        console.error('Extents not available for LLC projections (EPSG: 3978)');
        api.event.emit(
          notificationPayload(
            EVENT_NAMES.NOTIFICATIONS.NOTIFICATION_ADD,
            mapId,
            'warning',
            'Extents not available for LLC projections (EPSG: 3978)'
          )
        );
      } else {
        const mins = fromLonLat([mapConfig.viewSettings.extent[0], mapConfig.viewSettings.extent[1]], projection.getCode());
        const maxs = fromLonLat([mapConfig.viewSettings.extent[2], mapConfig.viewSettings.extent[3]], projection.getCode());
        extent = [mins[0], mins[1], maxs[0], maxs[1]];
      }
    }

    const initialMap = new OLMap({
      target: mapElement.current as string | HTMLElement | undefined,
      layers: defaultBasemap?.layers.map((layer) => {
        // create a tile layer for this basemap layer
        const tileLayer = new TileLayer({
          opacity: layer.opacity,
          source: layer.source,
        });

        // add this layer to the basemap group
        tileLayer.set('mapId', 'basemap');

        return tileLayer;
      }),
      view: new View({
        projection,
        center: fromLonLat([mapConfig.viewSettings.center[0], mapConfig.viewSettings.center[1]], projection),
        zoom: mapConfig.viewSettings.zoom,
        extent: extent || defaultBasemap?.defaultExtent || undefined,
        minZoom: mapConfig.viewSettings.minZoom || defaultBasemap?.zoomLevels.min || 0,
        maxZoom: mapConfig.viewSettings.maxZoom || defaultBasemap?.zoomLevels.max || 17,
      }),
      controls: [],
      keyboardEventTarget: document.getElementById(`map-${mapId}`) as HTMLElement,
    });

    initCGPVMap(initialMap);
  };

  const basemapLayerUpdateListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsABasemapLayerArray(payload)) {
      // remove previous basemaps
      const layers = api.maps[mapId].map.getAllLayers();

      // loop through all layers on the map
      for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
        const layer = layers[layerIndex];

        // get group id that this layer belongs to
        const layerId = layer.get('mapId');

        // check if the group id matches basemap
        if (layerId && layerId === 'basemap') {
          // remove the basemap layer
          api.maps[mapId].map.removeLayer(layer);
        }
      }

      // add basemap layers
      payload.layers.forEach((layer, index) => {
        const basemapLayer = new TileLayer({
          opacity: layer.opacity,
          source: layer.source,
        });

        // set this basemap's group id to basemap
        basemapLayer.set('mapId', 'basemap');

        // add the basemap layer
        api.maps[mapId].map.getLayers().insertAt(index, basemapLayer);

        // render the layer
        basemapLayer.changed();
      });
    }
  };

  const mapviewProjectionChangeListenetFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAMapViewProjection(payload)) {
      // on map view projection change, layer source needs to be refreshed
      const currentView = api.maps[mapId].getView();
      const centerCoordinate = toLonLat(currentView.getCenter()!, currentView.getProjection());
      api.maps[mapId].setView({
        projection: 3978,
        zoom: currentView.getZoom()!,
        center: [centerCoordinate[0], centerCoordinate[1]],
      });
      const mapLayers = api.maps[mapId].layer.geoviewLayers;
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
  };

  useEffect(() => {
    initMap();

    // listen to adding a new basemap events
    api.event.on(EVENT_NAMES.BASEMAP.EVENT_BASEMAP_LAYERS_UPDATE, basemapLayerUpdateListenerFunction, mapId);

    // listen to geoview-basemap-panel package change projection event
    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapviewProjectionChangeListenetFunction, mapId);

    return () => {
      api.event.off(EVENT_NAMES.BASEMAP.EVENT_BASEMAP_LAYERS_UPDATE, mapId, basemapLayerUpdateListenerFunction);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapId, mapviewProjectionChangeListenetFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', (e) => disableScrolling(e, mapElement));
    return () => {
      document.removeEventListener('keydown', (e) => disableScrolling(e, mapElement));
    };
  }, []);

  useEffect(() => {
    document.addEventListener('focusin', () => {
      const mapContainer = document.getElementById(mapId);
      if (mapElement.current === document.activeElement && mapContainer?.classList.contains('map-focus-trap')) {
        (document.getElementById(`map-${mapId}`) as HTMLElement).focus();
        api.event.emit(inKeyfocusPayload(EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, mapId));
      }
    });
    return () => document.removeEventListener('focusin', () => []);
  }, [mapId]);

  return (
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
    <div id={`map-${mapId}`} ref={mapElement as MutableRefObject<HTMLDivElement>} className={classes.mapContainer} tabIndex={0}>
      {isLoaded && (
        <>
          {components !== undefined && components.indexOf('north-arrow') > -1 && (
            <NorthArrow projection={api.projection.projections[api.maps[mapId].currentProjection].getCode()} />
          )}
          <NorthPoleFlag projection={api.projection.projections[api.maps[mapId].currentProjection].getCode()} />
          <Crosshair />
          <ClickMarker />
          <HoverTooltip />
          {deviceSizeMedUp && components !== undefined && components.indexOf('overview-map') > -1 && <OverviewMap />}
          {deviceSizeMedUp && <Footerbar />}
        </>
      )}
    </div>
  );
}

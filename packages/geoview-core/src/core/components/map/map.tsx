/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useRef, MutableRefObject, useState } from 'react';

import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { Collection } from 'ol';
import BaseLayer from 'ol/layer/Base';
import Source from 'ol/source/Source';
import { Extent } from 'ol/extent';

import makeStyles from '@mui/styles/makeStyles';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { useStore } from 'zustand';
import { XYZ } from 'ol/source';
import { getGeoViewStore } from '@/core/stores/stores-managers';

import { NorthArrow, NorthPoleFlag } from '@/core/components/north-arrow/north-arrow';
import { Crosshair } from '@/core/components/crosshair/crosshair';
import { OverviewMap } from '@/core/components/overview-map/overview-map';
import { ClickMarker } from '@/core/components/click-marker/click-marker';
import { HoverTooltip } from '@/core/components/hover-tooltip/hover-tooltip';

import { generateId } from '@/core/utils/utilities';

import { TypeBasemapLayer, api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { MapViewer } from '@/geo/map/map-viewer';

import { payloadIsABasemapLayerArray, payloadIsAMapViewProjection, PayloadBaseClass } from '@/api/events/payloads';
import { TypeBasemapProps, TypeMapFeaturesConfig } from '../../types/global-types';

const useStyles = makeStyles(() => ({
  mapContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    position: 'relative',
  },
}));

export function Map(mapFeaturesConfig: TypeMapFeaturesConfig): JSX.Element {
  const { map: mapConfig } = mapFeaturesConfig;

  // make sure the id is not undefined
  // eslint-disable-next-line react/destructuring-assignment
  const mapId = mapFeaturesConfig.mapId ? mapFeaturesConfig.mapId : generateId('');

  const classes = useStyles();

  // get ref to div element
  const mapElement = useRef<HTMLDivElement | undefined>();

  const [overviewBaseMap, setOverviewBaseMap] = useState<TypeBasemapProps | undefined>(undefined);

  // get values from the store
  const overviewMap = useStore(getGeoViewStore(mapId), (state) => state.mapState.overviewMap);
  const northArrow = useStore(getGeoViewStore(mapId), (state) => state.mapState.northArrow);
  const mapLoaded = useStore(getGeoViewStore(mapId), (state) => state.mapState.mapLoaded);

  // create a new map viewer instance
  const viewer: MapViewer = api.maps[mapId];

  const defaultTheme = useTheme();

  // if screen size is medium and up
  const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('md'));

  // TODO: do not deal with stuff not related to create the payload in the event, use the event on or store state to listen to change and do what is needed.
  // !This was in mapZoomEnd event.... listen to the event in proper place
  // Object.keys(layers).forEach((layer) => {
  //   if (layer.endsWith('-unclustered')) {
  //     const clusterLayerId = layer.replace('-unclustered', '');
  //     const splitZoom =
  //       (api.maps[mapId].layer.registeredLayers[clusterLayerId].source as TypeVectorSourceInitialConfig)!.cluster!.splitZoom || 7;
  //     if (prevZoom < splitZoom && currentZoom >= splitZoom) {
  //       api.maps[mapId].layer.registeredLayers[clusterLayerId]?.olLayer!.setVisible(false);
  //       api.maps[mapId].layer.registeredLayers[layer]?.olLayer!.setVisible(true);
  //     }
  //     if (prevZoom >= splitZoom && currentZoom < splitZoom) {
  //       api.maps[mapId].layer.registeredLayers[clusterLayerId]?.olLayer!.setVisible(true);
  //       api.maps[mapId].layer.registeredLayers[layer]?.olLayer!.setVisible(false);
  //     }
  //   }
  // });

  const initCGPVMap = (cgpvMap: OLMap) => {
    cgpvMap.set('mapId', mapId);

    // initialize the map viewer and load plugins
    viewer.initMap(cgpvMap);

    // load basemap(s)
    api.maps[mapId].basemap.loadDefaultBasemaps();

    // call the ready function since rendering of this map instance is done
    api.ready(() => {
      // load plugins once all maps have rendered
      api.plugin.loadPlugins();
    });

    viewer.toggleMapInteraction(mapConfig.interaction);
  };

  const initMap = async () => {
    // create map
    const projection = api.projection.projections[mapConfig.viewSettings.projection];

    // create empty tilelayer to use as initial basemap while we load basemap
    const emptyBasemap: TypeBasemapLayer = {
      basemapId: 'empty',
      source: new XYZ(),
      type: 'empty',
      opacity: 0,
      resolutions: [],
      origin: [],
      minScale: 0,
      maxScale: 17,
      extent: [0, 0, 0, 0],
    };
    const emptyLayer = new TileLayer(emptyBasemap);
    emptyLayer.set('mapId', 'basemap');

    let extent: Extent | undefined;
    if (mapConfig.viewSettings?.extent) extent = transformExtent(mapConfig.viewSettings.extent, 'EPSG:4326', projection.getCode());

    const initialMap = new OLMap({
      target: mapElement.current as string | HTMLElement | undefined,
      layers: [emptyLayer],
      view: new View({
        projection,
        center: fromLonLat([mapConfig.viewSettings.center[0], mapConfig.viewSettings.center[1]], projection),
        zoom: mapConfig.viewSettings.zoom,
        extent: extent || undefined,
        minZoom: mapConfig.viewSettings.minZoom || 0,
        maxZoom: mapConfig.viewSettings.maxZoom || 17,
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

      // update overview basemap
      if (api.maps[mapId].basemap.overviewMap) setOverviewBaseMap(api.maps[mapId].basemap.overviewMap);
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
        refreshBaseLayer(mapLayerEntry[1].olLayers);
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

  return (
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
    <div id={`map-${mapId}`} ref={mapElement as MutableRefObject<HTMLDivElement>} className={classes.mapContainer} tabIndex={0}>
      {mapLoaded && (
        <>
          {northArrow && <NorthArrow />}
          <NorthPoleFlag />
          <Crosshair />
          <ClickMarker />
          <HoverTooltip />
          {deviceSizeMedUp && overviewMap && overviewBaseMap && <OverviewMap />}
        </>
      )}
    </div>
  );
}

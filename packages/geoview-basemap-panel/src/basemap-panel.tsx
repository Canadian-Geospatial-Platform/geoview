import { TypeBasemapProps, TypeBasemapOptions, TypeJsonObject, TypeSelectChangeEvent, TypeWindow, TypeMapView } from 'geoview-core';
import { mapViewProjectionPayload } from 'geoview-core/src/api/events/payloads/map-view-projection-payload';

const w = window as TypeWindow;

interface BaseMapPanelProps {
  mapId: string;
  config: TypeJsonObject;
}

export function BasemapPanel(props: BaseMapPanelProps): JSX.Element {
  const { mapId, config } = props;

  const { cgpv } = w;

  const { api, react, ui } = cgpv;
  const { Select } = ui.elements;

  const { useState, useEffect } = react;

  const useStyles = ui.makeStyles(() => ({
    listContainer: {
      marginTop: '10px',
      height: '95%',
    },
    card: {
      boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
      transition: '0.3s',
      borderRadius: '5px',
      '&:hover': {
        boxShadow: '0 8px 16px 0 rgba(0, 0, 0, 0.2)',
      },
      marginBottom: 10,
      height: '250px',
      width: '100%',
      display: 'block',
      position: 'relative',
    },
    thumbnail: {
      borderRadius: '5px',
      position: 'absolute',
      height: '100%',
      width: '100%',
      opacity: 0.8,
    },
    container: {
      background: 'rgba(0,0,0,.68)',
      color: '#fff',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 5px',
      boxSizing: 'border-box',
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: 'inherit',
    },
  }));

  const [basemapList, setBasemapList] = useState<TypeBasemapProps[]>([]);
  const [canSwichProjection] = useState(config.canSwichProjection);

  const classes = useStyles();

  const projections: number[] = (config.supportedProjection as number[]) || [];
  const [mapProjection, setMapProjection] = useState(cgpv.api.map(mapId).mapProps.map.projection);

  /**
   * Update the basemap with the layers on the map
   *
   * @param {string} id update the basemap on the map
   */
  const setBasemap = (id: string) => {
    api.map(mapId).basemap.setBasemap(id);
  };

  /**
   * Add basemaps from configuration
   */
  const addBasemaps = async () => {
    // reset the basemaps array
    api.map(mapId).basemap.basemaps = [];

    // create the custom config basemap
    for (let basemapIndex = 0; basemapIndex < config.customBasemaps.length; basemapIndex++) {
      const customBasemap = config.customBasemaps[basemapIndex] as TypeJsonObject;
      const basemap = api.map(mapId).basemap.createCustomBasemap(customBasemap as unknown as TypeBasemapProps);
      if (basemap) setBasemapList((prevArray) => [...prevArray, basemap]);

      // custom basemap are provided set it by default (can't be set as basemap from geoview config)
      if (basemap && basemapIndex === 0) setBasemap(basemap.id!);
    }

    // create the core basemap
    for (let basemapIndex = 0; basemapIndex < config.coreBasemaps.length; basemapIndex++) {
      const basemapOptions = config.coreBasemaps[basemapIndex] as TypeJsonObject;
      // eslint-disable-next-line no-await-in-loop
      const basemap = await api.map(mapId).basemap.createCoreBasemap(basemapOptions as unknown as TypeBasemapOptions);
      if (basemap) setBasemapList((prevArray) => [...prevArray, basemap]);
    }
  };

  /**
   * Set layerType from form input
   *
   * @param {TypeSelectChangeEvent} event TextField event
   */
  const setSelectedProjection = (event: TypeSelectChangeEvent<unknown>) => {
    setMapProjection(event.target.value as number);
    api.event.emit(mapViewProjectionPayload(api.eventNames.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapId, event.target.value as number));

    // get view status
    const currentView = api.map(mapId).getView();
    const currentCenter = currentView.getCenter();
    const currentProjection = currentView.getProjection().getCode();

    // calculate points resolution and new center (from lat long)
    const currentPointResolution = api.projection.getResolution(currentProjection, currentCenter as number[]);
    const newCenter = api.projection.transformPoints(currentCenter, currentProjection, 'EPSG:4326')[0];
    const newProjection = `EPSG:${event.target.value as number}`;
    const newPointResolution = api.projection.getResolution(newProjection, newCenter as number[]);
    const newResolution = (currentView.getResolution() || 0 * currentPointResolution) / newPointResolution;

    const newView: TypeMapView = {
      zoom: currentView.getZoom() as number,
      minZoom: currentView.getMinZoom(),
      maxZoom: currentView.getMaxZoom(),
      center: newCenter as number[],
      projection: newProjection as string,
      resolution: newResolution,
    };

    api.map(mapId).setView(newView);
  };

  /**
   * load existing basemaps and create new basemaps
   */
  useEffect(() => {
    addBasemaps();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {canSwichProjection && (
        <Select
          fullWidth
          labelId="projection-label"
          value={mapProjection}
          onChange={setSelectedProjection}
          label="Projection"
          style={{
            display: config.canSwichProjection ? 'flex' : 'none',
          }}
          inputLabel={{
            id: 'projection-label',
          }}
          menuItems={projections.map((value: number) => ({
            key: value,
            item: {
              value,
              children: `EPSG:${value}`,
            },
          }))}
        />
      )}
      <div className={classes.listContainer}>
        {basemapList.map((basemap: TypeBasemapProps) => {
          return (
            <div
              role="button"
              tabIndex={0}
              className={classes.card}
              onClick={() => setBasemap(basemap.id as string)}
              onKeyPress={() => setBasemap(basemap.id as string)}
              key={basemap.id}
            >
              {typeof basemap.thumbnailUrl === 'string' && (
                <img src={basemap.thumbnailUrl} alt={basemap.altText} className={classes.thumbnail} />
              )}
              {Array.isArray(basemap.thumbnailUrl) &&
                basemap.thumbnailUrl.map((thumbnail, index) => {
                  // eslint-disable-next-line react/no-array-index-key
                  return <img key={index} src={thumbnail} alt={basemap.altText} className={classes.thumbnail} />;
                })}
              <div className={classes.container}>{basemap.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

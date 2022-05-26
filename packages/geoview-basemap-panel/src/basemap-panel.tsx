import { TypeBasemapProps, TypeBasemapOptions, TypeJsonObject, TypeWindow } from 'geoview-core';

const w = window as TypeWindow;

interface BaseMapPanelProps {
  mapId: string;
  config: TypeJsonObject;
}

export function BasemapPanel(props: BaseMapPanelProps): JSX.Element {
  const { mapId, config } = props;

  const { cgpv } = w;

  const { api, react, ui } = cgpv;

  const { useState, useEffect } = react;

  const useStyles = ui.makeStyles(() => ({
    listContainer: {
      overflowY: 'scroll',
      height: '600px',
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

  const classes = useStyles();

  /**
   * Update the basemap with the layers on the map
   *
   * @param {string} id update the basemap on the map
   */
  const setBasemap = (id: string) => {
    api.map(mapId).basemap.setBasemap(id);
  };

  /**
   * load existing basemaps and create new basemaps
   */
  useEffect(() => {
    // reset the basemaps array
    api.map(mapId).basemap.basemaps = [];

    // get existing basemaps
    const { basemaps } = api.map(mapId).basemap;

    // create the core basemap
    for (let basemapIndex = 0; basemapIndex < config.coreBasemaps.length; basemapIndex++) {
      const basemap = config.coreBasemaps[basemapIndex] as TypeJsonObject;
      api.map(mapId).basemap.createCoreBasemap(basemap as unknown as TypeBasemapOptions);
    }

    // create the custom config basemap
    for (let basemapIndex = 0; basemapIndex < config.customBasemaps.length; basemapIndex++) {
      const customBasemap = config.customBasemaps[basemapIndex] as TypeJsonObject;
      api.map(mapId).basemap.createCustomBasemap(customBasemap as unknown as TypeBasemapProps);
    }

    // set the basemaps in the list
    setBasemapList(basemaps);
  }, [api, config.coreBasemaps, config.customBasemaps, mapId]);

  return (
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
  );
}

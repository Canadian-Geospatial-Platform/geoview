import { TypeBasemapProps, TypeWindow } from 'geoview-core';

const w = window as TypeWindow;

interface BaseMapSwitcherProps {
  mapId: string;
}

export function BasemapSwitcher(props: BaseMapSwitcherProps): JSX.Element {
  const { mapId } = props;

  const { cgpv } = w;

  const { api, react, ui, useTranslation } = cgpv;

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
      height: '120px',
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

  const [basemapList, setBasemapList] = useState([]);

  const classes = useStyles();

  const { t } = useTranslation();

  /**
   * Create a new basemap
   *
   * @param {string} id the id of the basemap to be created
   * @param {Object} basemapProps basemap properties
   */
  const createBasemap = (id: string, basemapProps: TypeBasemapProps) => {
    const { basemaps } = api.map(mapId).basemap;

    // check if basemap with provided ID exists
    const exists = basemaps.filter((basemap: TypeBasemapProps) => basemap.id === id);

    // if basemap does not exist then create a new one
    if (exists.length === 0) {
      const basemap = { ...basemapProps, id };

      // create the basemap
      api.map(mapId).basemap.createBasemap(basemap);
    }
  };

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
    // get existing basemaps
    const { basemaps } = api.map(mapId).basemap;

    // set the basemaps in the list
    setBasemapList(basemaps);

    // create a new basemap with transport and label layers
    createBasemap('transportWithLabels', {
      name: t('basemap-transport-label.name'),
      type: 'transport_label',
      description:
        'This Canadian basemap provides geographic context with bilingual labels and an emphasis on transportation networks. From Natural Resources Canada.',
      descSummary: '',
      altText: t('basemap-transport-label.name'),
      thumbnailUrl: '',
      layers: [
        {
          id: 'transport',
          type: 'transport',
          url: 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT_CBCT_GEOM_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
          opacity: 1,
          basemapPaneName: 'transport',
          options: {
            tms: false,
            tileSize: 1,
            noWrap: false,
            attribution: false,
          },
        },
        {
          id: 'label',
          type: 'label',
          url: 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/xxxx_TXT_3978/MapServer/WMTS/tile/1.0.0/xxxx_TXT_3978/default/default028mm/{z}/{y}/{x}.jpg'.replaceAll(
            'xxxx',
            t('layer.type')
          ),
          opacity: 1,
          basemapPaneName: 'label',
          options: {
            tms: false,
            tileSize: 1,
            noWrap: false,
            attribution: false,
          },
        },
      ],
      attribution: 'test attribution',
      zoomLevels: {
        min: 0,
        max: 0,
      },
    });

    // create a new basemap with only transport layer
    createBasemap('transportWithNoLabels', {
      name: t('basemap-transport.name'),
      type: 'transport',
      description:
        'This Canadian basemap provides geographic context that emphasis on transportation networks. From Natural Resources Canada.',
      descSummary: '',
      altText: t('basemap-transport.name'),
      thumbnailUrl: '',
      layers: [
        {
          id: 'transport',
          type: 'transport',
          url: 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT_CBCT_GEOM_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
          opacity: 1,
          basemapPaneName: 'transport',
          options: {
            tms: false,
            tileSize: 1,
            noWrap: false,
            attribution: false,
          },
        },
      ],
      attribution: 'test attribution',
      zoomLevels: {
        min: 0,
        max: 0,
      },
    });

    // create a new basemap with shaded relief layer
    createBasemap('shadedRelief', {
      name: t('basemap-shaded.name'),
      type: 'shaded',
      description: '":"This Canadian base map provides geographic context using shaded relief. From Natural Resources Canada.',
      descSummary: '',
      altText: t('basemap-shaded.name'),
      thumbnailUrl: '',
      layers: [
        {
          id: 'shaded',
          type: 'shaded',
          url: 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
          opacity: 1,
          basemapPaneName: 'shaded',
          options: {
            tms: false,
            tileSize: 1,
            noWrap: false,
            attribution: false,
          },
        },
      ],
      attribution: 'test attribution',
      zoomLevels: {
        min: 0,
        max: 0,
      },
    });

    // create a new basemap with shaded relief and labels layer
    createBasemap('shadedLabel', {
      name: t('basemap-shaded-label.name'),
      type: 'shaded_label',
      description: '":"This Canadian base map provides geographic context using shaded relief with labels. From Natural Resources Canada.',
      descSummary: '',
      altText: t('basemap-shaded-label.name'),
      thumbnailUrl: '',
      layers: [
        {
          id: 'shaded',
          type: 'shaded',
          url: 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
          opacity: 1,
          basemapPaneName: 'shaded',
          options: {
            tms: false,
            tileSize: 1,
            noWrap: false,
            attribution: false,
          },
        },
        {
          id: 'label',
          type: 'label',
          url: 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/xxxx_TXT_3978/MapServer/WMTS/tile/1.0.0/xxxx_TXT_3978/default/default028mm/{z}/{y}/{x}.jpg'.replaceAll(
            'xxxx',
            t('layer.type')
          ),
          opacity: 1,
          basemapPaneName: 'label',
          options: {
            tms: false,
            tileSize: 1,
            noWrap: false,
            attribution: false,
          },
        },
      ],
      attribution: 'test attribution',
      zoomLevels: {
        min: 0,
        max: 0,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={classes.listContainer}>
      {basemapList.map((basemap: TypeBasemapProps) => {
        return (
          <div
            role="button"
            tabIndex={0}
            className={classes.card}
            onClick={() => setBasemap(basemap.id!)}
            onKeyPress={() => setBasemap(basemap.id!)}
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

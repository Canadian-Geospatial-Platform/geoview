import {
  toJsonObject,
  TypeBasemapProps,
  TypeJsonObject,
  SelectChangeEvent,
  TypeWindow,
  TypeViewSettings,
  mapViewProjectionPayload,
  TypeBasemapOptions,
  TypeProjectionCodes,
} from 'geoview-core';

import { mapViewProjectionPayload } from 'geoview-core/src/api/events/payloads/map-view-projection-payload';

const w = window as TypeWindow;

interface BaseMapPanelProps {
  mapId: string;
  config: TypeJsonObject;
}

export function BasemapPanel(props: BaseMapPanelProps): JSX.Element {
  const { mapId, config } = props;

  const { cgpv } = w;
  const myMap = cgpv.api.map(mapId);

  const { api, react, ui } = cgpv;
  const { Select, Card } = ui.elements;

  const { useState, useEffect } = react;

  const [basemapList, setBasemapList] = useState<TypeBasemapProps[]>([]);
  const [activeBasemapId, setActiveBasemapId] = useState<string>('');
  const [canSwichProjection] = useState(config.canSwichProjection);

  const useStyles = ui.makeStyles((theme) => ({
    basemapCard: {
      backgroundColor: theme.palette.primary.dark,
      color: theme.palette.primary.light,
      display: 'flex',
      flexDirection: 'column',
      backgroundClip: 'padding-box',
      border: `1px solid ${theme.basemapPanel.borderDefault}`,
      borderRadius: 6,
      boxShadow: 'none',
      marginBottom: 16,
      transition: 'all 0.3s ease-in-out',
      '&:last-child': {
        marginBottom: 0,
      },
      '& .MuiCardHeader-root': {
        backgroundColor: theme.palette.primary.dark,
        color: theme.basemapPanel.header,
        fontSize: 14,
        fontWeight: 400,
        margin: 0,
        padding: '0 12px',
        height: 60,
        width: '100%',
        order: 2,
      },
      '& .MuiCardContent-root': {
        order: 1,
        height: 190,
        position: 'relative',
        padding: 0,
        '&:last-child': {
          padding: 0,
        },
        '& .basemapCardThumbnail': {
          position: 'absolute',
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          top: 0,
          left: 0,
        },
        '& .basemapCardThumbnailOverlay': {
          display: 'block',
          height: '100%',
          width: '100%',
          position: 'absolute',
          backgroundColor: theme.basemapPanel.overlayDefault,
          transition: 'all 0.3s ease-in-out',
        },
      },
      '&:hover': {
        cursor: 'pointer',
        borderColor: theme.basemapPanel.borderHover,
        '& .MuiCardContent-root': {
          '& .basemapCardThumbnailOverlay': {
            backgroundColor: theme.basemapPanel.overlayHover,
          },
        },
      },
      '&.active': {
        borderColor: theme.basemapPanel.borderActive,
        '& .MuiCardContent-root': {
          '& .basemapCardThumbnailOverlay': {
            backgroundColor: theme.basemapPanel.overlayActive,
          },
        },
        '&:hover': {
          borderColor: 'rgba(255,255,255,0.75)',
          '& .MuiCardContent-root': {
            '& .basemapCardThumbnailOverlay': {
              backgroundColor: 'rgba(0,0,0,0)',
            },
          },
        },
      },
    },
  }));
  const classes = useStyles();

  // TODO: change the path for getting projection on schema refactor
  const projections: number[] =
    (config.supportedProjections as Array<TypeJsonObject>).map((obj: TypeJsonObject) => obj?.projectionCode as number) || [];
  const [mapProjection, setMapProjection] = useState(myMap.mapFeaturesConfig.map.viewSettings.projection);

  /**
   * Update the basemap with the layers on the map
   *
   * @param {string} id update the basemap on the map
   */
  const setBasemap = (id: string) => {
    // set the new basemap and update the active basemap variable
    myMap.basemap.setBasemap(id);
    setActiveBasemapId(id);
  };

  /**
   *  Add basemaps from configuration for selected projection
   *
   * @param {number} projection the projection to create basemaps for
   */
  const createBasemapArray = async (projection: TypeProjectionCodes) => {
    const basemapsArray = toJsonObject(
      (config.supportedProjections as Array<TypeJsonObject>).find((obj: TypeJsonObject) => obj.projectionCode === projection)
    );
    let isInit = false;

    // reset the basemaps array
    api.map(mapId).basemap.basemaps = [];
    setBasemapList([]);

    // create the custom config basemap
    for (let basemapIndex = 0; basemapIndex < basemapsArray.customBasemaps.length; basemapIndex++) {
      const customBasemap = basemapsArray.customBasemaps[basemapIndex] as TypeJsonObject;
      const basemap = api.map(mapId).basemap.createCustomBasemap(customBasemap as unknown as TypeBasemapProps);
      if (basemap) setBasemapList((prevArray) => [...prevArray, basemap]);

      // custom basemap are provided set it by default (can't be set as basemap from geoview config)
      if (basemap && basemapIndex === 0 && activeBasemapId === '') {
        setBasemap(basemap.id!);
        isInit = true;
      }
    }

    // create the core basemap
    for (let basemapIndex = 0; basemapIndex < basemapsArray.coreBasemaps.length; basemapIndex++) {
      const basemapOptions = basemapsArray.coreBasemaps[basemapIndex] as TypeJsonObject;
      // eslint-disable-next-line no-await-in-loop
      const basemap = await api.map(mapId).basemap.createCoreBasemap(basemapOptions as unknown as TypeBasemapOptions, projection);
      if (basemap) setBasemapList((prevArray) => [...prevArray, basemap]);

      // set basemap if previously selected in previous projection
      const id = `${basemapOptions.shaded ? 'shaded' : ''}${basemapOptions.id}${basemapOptions.labeled ? 'label' : ''}`;
      if (basemap && id === activeBasemapId && !isInit) {
        setBasemap(activeBasemapId);
        isInit = true;
      }
    }

    // if previous basemap does not exist in previous projection, init first one
    if (!isInit) setBasemap(myMap.basemap.basemaps[0].id as string);
  };

  /**
   * Set new projection view and basemap array
   *
   * @param {SelectChangeEvent} event select change element event
   */
  const setSelectedProjection = (event: SelectChangeEvent<unknown>) => {
    const projection = event.target.value as TypeProjectionCodes;

    // set basemap to no geom to clean up the view
    setBasemap('nogeom');
    setMapProjection(projection as TypeProjectionCodes);

    // get view status (center and projection) to calculate new center
    const currentView = myMap.getView();
    const currentCenter = currentView.getCenter();
    const currentProjection = currentView.getProjection().getCode();
    const newCenter = api.projection.transformPoints(currentCenter, currentProjection, 'EPSG:4326')[0];
    const newProjection = event.target.value as TypeProjectionCodes;

    const newView: TypeViewSettings = {
      zoom: currentView.getZoom() as number,
      minZoom: currentView.getMinZoom(),
      maxZoom: currentView.getMaxZoom(),
      center: newCenter as [number, number],
      projection: newProjection,
    };

    // set new view and basemaps array (with selected basemap)
    myMap.setView(newView);
    createBasemapArray(projection);

    // emit an event to let know map view projection as changed
    api.event.emit(mapViewProjectionPayload(api.eventNames.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapId, projection));
  };

  /**
   * load existing basemaps and create new basemaps
   */
  useEffect(() => {
    createBasemapArray(mapProjection);
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
      {basemapList.map((basemap: TypeBasemapProps) => {
        return (
          <Card
            tabIndex={0}
            classes={{ root: classes.basemapCard }}
            className={`${basemap.id === activeBasemapId ? 'active' : ''}`}
            onClick={() => setBasemap(basemap.id as string)}
            onKeyPress={() => setBasemap(basemap.id as string)}
            key={basemap.id}
            title={basemap.name}
            content={
              <>
                {typeof basemap.thumbnailUrl === 'string' && (
                  <img src={basemap.thumbnailUrl} alt={basemap.altText} className="basemapCardThumbnail" />
                )}
                {Array.isArray(basemap.thumbnailUrl) &&
                  basemap.thumbnailUrl.map((thumbnail, index) => {
                    // eslint-disable-next-line react/no-array-index-key
                    return <img key={index} src={thumbnail} alt={basemap.altText} className="basemapCardThumbnail" />;
                  })}
                <div className="basemapCardThumbnailOverlay" />
              </>
            }
          />
        );
      })}
    </div>
  );
}

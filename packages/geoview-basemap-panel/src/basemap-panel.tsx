import { TypeBasemapProps } from 'geoview-core/src/geo/layer/basemap/basemap-types';
import { TypeJsonObject, TypeJsonArray, toJsonObject, SelectChangeEvent } from 'geoview-core/src/core/types/global-types';
import { useMapProjection } from 'geoview-core/src/core/stores/store-interface-and-intial-values/map-state';
import { useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { TypeBasemapOptions, TypeValidMapProjectionCodes, TypeDisplayLanguage } from 'geoview-core/src/api/config/types/map-schema-types';
import { logger } from 'geoview-core/src/core/utils/logger';
import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { getSxClasses } from './basemap-panel-style';

interface BaseMapPanelProps {
  mapId: string;
  config: TypeJsonObject;
}

export function BasemapPanel(props: BaseMapPanelProps): JSX.Element {
  const { mapId, config } = props;

  const { cgpv } = window;
  const myMap = cgpv.api.maps[mapId];

  const { api, ui, react } = cgpv;
  const { Select, Card, Box } = ui.elements;

  const { useState, useEffect } = react;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state and store values
  const [basemapList, setBasemapList] = useState<TypeBasemapProps[]>([]);
  const [activeBasemapId, setActiveBasemapId] = useState<string>('');
  const [canSwichProjection] = useState(config.canSwichProjection);
  const projections: number[] =
    (config.supportedProjections as TypeJsonArray).map((obj: TypeJsonObject) => obj?.projectionCode as number) || [];
  const storeProjection = useMapProjection();
  const [mapProjection, setMapProjection] = useState(storeProjection);
  const language = useAppDisplayLanguage();

  // #region PRIVATE UTILITY FUNCTIONS
  /**
   * Get basemap thumbnail url
   *
   * @param {string[]} basemapTypes basemap layer type (shaded, transport, label, simple)
   * @param {TypeValidMapProjectionCodes} projection basemap projection
   * @param {TypeDisplayLanguage} displayLanguage basemap language
   *
   * @returns {string[]} array of thumbnail urls
   */
  function getThumbnailUrl(
    basemapTypes: string[],
    projection: TypeValidMapProjectionCodes,
    displayLanguage: TypeDisplayLanguage
  ): string[] {
    const thumbnailUrls: string[] = [];

    for (let typeIndex = 0; typeIndex < basemapTypes.length; typeIndex++) {
      const type = basemapTypes[typeIndex];

      if (type === 'transport') {
        if (myMap.basemap.basemapsList[projection].transport?.url) {
          thumbnailUrls.push(
            (myMap.basemap.basemapsList[projection].transport?.url as string)
              .replace('{z}', '8')
              .replace('{y}', projection === 3978 ? '285' : '91')
              .replace('{x}', projection === 3978 ? '268' : '74')
          );
        }
      }

      if (type === 'simple') {
        // Only available in 3978
        if (myMap.basemap.basemapsList[projection].simple?.url) {
          thumbnailUrls.push(
            (myMap.basemap.basemapsList[projection].simple.url as string).replace('{z}', '8').replace('{y}', '285').replace('{x}', '268')
          );
        }
      }

      if (type === 'shaded') {
        // Only available in 3978
        if (myMap.basemap.basemapsList[projection].shaded?.url) {
          thumbnailUrls.push(
            (myMap.basemap.basemapsList[projection].shaded.url as string).replace('{z}', '8').replace('{y}', '285').replace('{x}', '268')
          );
        }
      }

      if (type === 'label') {
        if (myMap.basemap.basemapsList[projection].label?.url) {
          thumbnailUrls.push(
            (myMap.basemap.basemapsList[projection].label.url as string)
              .replaceAll('xxxx', displayLanguage === 'en' ? 'CBMT' : 'CBCT')
              .replace('{z}', '8')
              .replace('{y}', projection === 3978 ? '285' : '91')
              .replace('{x}', projection === 3978 ? '268' : '74')
          );
        }
      }

      if (type === 'osm') {
        thumbnailUrls.push('https://tile.openstreetmap.org/0/0/0.png');
      }
    }

    return thumbnailUrls;
  }

  /**
   * Get basemap information (name and description)
   *
   * @param {string[]} basemapTypes basemap layer type (shaded, transport, label, simple)
   * @returns { name: string; description: string } array with information [name, description]
   */
  function getInfo(basemapTypes: string[]): { name: string; description: string } {
    let name = '';
    let description = '';

    if (basemapTypes.includes('osm')) {
      name = getLocalizedMessage('basemapPanel.info.osm.name', language);
    } else if (basemapTypes.includes('transport')) {
      name = getLocalizedMessage('basemapPanel.info.transport.name', language);
      description = getLocalizedMessage('basemapPanel.info.transport.description', language);
    } else if (basemapTypes.includes('simple')) {
      name = getLocalizedMessage('basemapPanel.info.simple.name', language);
    } else if (basemapTypes.includes('shaded')) {
      name = getLocalizedMessage('basemapPanel.info.shaded.name', language);
      description = getLocalizedMessage('basemapPanel.info.shaded.description', language);
    } else if (basemapTypes.includes('nogeom')) {
      name = getLocalizedMessage('basemapPanel.info.nogeom.name', language);
    }

    if (basemapTypes.includes('label')) name = `${name} ${getLocalizedMessage('basemapPanel.info.label.name', language)}`;

    return { name, description };
  }
  // #endregion

  /**
   * Update the basemap with the layers on the map
   *
   * @param {string} id update the basemap on the map
   */
  const setBasemap = (basemapId: string): void => {
    // get basemap from id
    const basemap = basemapList.find((item) => item.basemapId === basemapId);

    // set the new basemap and update the active basemap variable
    if (basemap !== undefined) {
      myMap.basemap.setBasemap(basemap);
      setActiveBasemapId(basemapId);
    }
  };

  /**
   *  Add basemaps from configuration for selected projection
   *
   * @param {number} projection the projection to create basemaps for
   * @returns {Promise<void>}
   */
  const createBasemapArray = async (projection: TypeValidMapProjectionCodes): Promise<void> => {
    const basemapsArray = toJsonObject(
      (config.supportedProjections as Array<TypeJsonObject>).find((obj: TypeJsonObject) => obj.projectionCode === projection)
    );
    let isInit = false;

    // reset the basemaps array
    setBasemapList([]);

    // create the custom config basemap
    for (let basemapIndex = 0; basemapIndex < (basemapsArray.customBasemaps.length as number); basemapIndex++) {
      const customBasemap = basemapsArray.customBasemaps[basemapIndex] as TypeJsonObject;
      const basemap = api.maps[mapId].basemap.createCustomBasemap(customBasemap as unknown as TypeBasemapProps, projection);
      if (basemap) setBasemapList((prevArray) => [...prevArray, basemap]);

      // custom basemap are provided set it by default (can't be set as basemap from geoview config)
      if (basemap && basemapIndex === 0 && activeBasemapId === '') {
        setBasemap(basemap.basemapId!);
        isInit = true;
      }
    }

    // create the core basemap
    for (let basemapIndex = 0; basemapIndex < (basemapsArray.coreBasemaps.length as number); basemapIndex++) {
      const basemapOptions = basemapsArray.coreBasemaps[basemapIndex] as TypeJsonObject;
      // TODO: Check - Should probably move the await outside of the loop so that all core basemaps start processing in parallel?
      // TO.DOCONT: If doing so, be mindful of the isInit which seems to prioritize the first basemap in the list (and maybe why this await is in the loop?)
      // eslint-disable-next-line no-await-in-loop
      const basemap = await api.maps[mapId].basemap.createCoreBasemap(basemapOptions as unknown as TypeBasemapOptions, projection);

      if (basemap) {
        // get thumbnail and info (name and description) for core basemap
        const { name, description } = getInfo(basemap.type.split('-'));
        basemap.thumbnailUrl = getThumbnailUrl(basemap.type.split('-'), storeProjection, language);
        basemap.name = name;
        basemap.description = description;

        setBasemapList((prevArray) => [...prevArray, basemap]);
      }

      // set basemap if previously selected in previous projection
      const id = `${basemapOptions.shaded ? 'shaded' : ''}${basemapOptions.id}${basemapOptions.labeled ? 'label' : ''}`;
      if (basemap && id === activeBasemapId && !isInit) {
        setBasemap(activeBasemapId);
        isInit = true;
      }
    }

    // if previous basemap does not exist in previous projection, init first one
    if (!isInit) setBasemap(basemapList[0] as unknown as string);
  };

  /**
   * Set new projection view and basemap array
   *
   * @param {SelectChangeEvent} event select change element event
   */
  const setSelectedProjection = (event: SelectChangeEvent<unknown>): void => {
    const projection = event.target.value as TypeValidMapProjectionCodes;

    // set basemap to no geom to clean up the view
    setBasemap('nogeom');
    setMapProjection(projection as TypeValidMapProjectionCodes);

    createBasemapArray(projection)
      .then(() => {
        // emit an event to let know map view projection as changed
        myMap.setProjection(projection);
      })
      .catch((error) => {
        // Log
        logger.logPromiseFailed('createBasemapArray in setSelectedProjection in basemap-panel', error);
      });
  };

  /**
   * load existing basemaps and create new basemaps
   */
  useEffect(() => {
    createBasemapArray(mapProjection).catch((error) => {
      // Log
      logger.logPromiseFailed('createBasemapArray in useEffect in basemap-panel', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  return (
    <Box sx={sxClasses.basemapCard}>
      {canSwichProjection && (
        <Select
          fullWidth
          labelId="projection-label"
          value={mapProjection}
          onChange={setSelectedProjection}
          label="Projection"
          style={{
            display: config.canSwichProjection ? 'flex' : 'none',
            marginBottom: '8px',
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
          variant="standard"
        />
      )}
      {basemapList.map((basemap: TypeBasemapProps) => {
        return (
          <Card
            tabIndex={0}
            className={basemap.basemapId === activeBasemapId ? 'active' : ''}
            onClick={() => setBasemap(basemap.basemapId as string)}
            onKeyPress={() => setBasemap(basemap.basemapId as string)}
            key={basemap.basemapId}
            title={basemap.name}
            contentCard={
              <>
                {typeof basemap.thumbnailUrl === 'string' && (
                  <Box component="img" src={basemap.thumbnailUrl} alt={basemap.altText} className="basemapCardThumbnail" />
                )}
                {Array.isArray(basemap.thumbnailUrl) &&
                  (basemap.thumbnailUrl as string[]).map((thumbnail, index) => {
                    // eslint-disable-next-line react/no-array-index-key
                    return <Box component="img" key={index} src={thumbnail} alt={basemap.altText} className="basemapCardThumbnail" />;
                  })}
                <Box className={basemap.basemapId !== activeBasemapId ? 'basemapCardThumbnailOverlay' : ''} />
              </>
            }
          />
        );
      })}
    </Box>
  );
}

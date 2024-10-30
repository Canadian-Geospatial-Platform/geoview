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

// Tiles to use for thumbnails by projection
const thumbnailYX = {
  3857: ['91', '74'],
  3978: ['285', '268'],
};

// Zoom to use for thumbnails
const thumbnailZoom = '8';

export function BasemapPanel(props: BaseMapPanelProps): JSX.Element {
  const { mapId, config } = props;

  const { cgpv } = window;
  const myMap = cgpv.api.maps[mapId];

  const { api, ui, react } = cgpv;
  const { Select, Card, Box } = ui.elements;

  const { useState, useEffect } = react;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  // Internal state and store values
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
   * Get basemap thumbnail url.
   * @param {string[]} basemapTypes - Basemap layer type (shaded, transport, label, simple, imagery).
   * @param {TypeValidMapProjectionCodes} projection - Basemap projection.
   * @param {TypeDisplayLanguage} displayLanguage - Basemap language.
   * @returns {string[]} Array of thumbnail urls.
   */
  function getThumbnailUrl(
    basemapTypes: string[],
    projection: TypeValidMapProjectionCodes,
    displayLanguage: TypeDisplayLanguage,
  ): string[] {
    const thumbnailUrls: string[] = [];

    for (let typeIndex = 0; typeIndex < basemapTypes.length; typeIndex++) {
      const type = basemapTypes[typeIndex];

      if (type === 'transport') {
        if (myMap.basemap.basemapsList[projection].transport?.url) {
          thumbnailUrls.push(
            (myMap.basemap.basemapsList[projection].transport?.url as string)
              .replace('{z}', thumbnailZoom)
              .replace('{y}', projection === 3978 ? thumbnailYX[3978][0] : thumbnailYX[3857][0])
              .replace('{x}', projection === 3978 ? thumbnailYX[3978][1] : thumbnailYX[3857][1]),
          );
        }
      }

      if (type === 'simple') {
        // Only available in 3978
        if (myMap.basemap.basemapsList[projection].simple?.url) {
          thumbnailUrls.push(
            (myMap.basemap.basemapsList[projection].simple.url as string)
              .replace('{z}', thumbnailZoom)
              .replace('{y}', thumbnailYX[3978][0])
              .replace('{x}', thumbnailYX[3978][1]),
          );
        }
      }

      if (type === 'shaded') {
        // Only available in 3978
        if (myMap.basemap.basemapsList[projection].shaded?.url) {
          thumbnailUrls.push(
            (myMap.basemap.basemapsList[projection].shaded.url as string)
              .replace('{z}', thumbnailZoom)
              .replace('{y}', thumbnailYX[3978][0])
              .replace('{x}', thumbnailYX[3978][1]),
          );
        }
      }

      if (type === 'label') {
        if (myMap.basemap.basemapsList[projection].label?.url) {
          thumbnailUrls.push(
            (myMap.basemap.basemapsList[projection].label.url as string)
              .replaceAll('xxxx', displayLanguage === 'en' ? 'CBMT' : 'CBCT')
              .replace('{z}', thumbnailZoom)
              .replace('{y}', projection === 3978 ? thumbnailYX[3978][0] : thumbnailYX[3857][0])
              .replace('{x}', projection === 3978 ? thumbnailYX[3978][1] : thumbnailYX[3857][1]),
          );
        }
      }

      if (type === 'osm') {
        thumbnailUrls.push('https://tile.openstreetmap.org/0/0/0.png');
      }

      if (type === 'imagery') {
        if (myMap.basemap.basemapsList[projection].imagery?.url) {
          thumbnailUrls.push(
            (myMap.basemap.basemapsList[projection].imagery?.url as string)
              .replace('{z}', thumbnailZoom)
              .replace('{y}', projection === 3978 ? thumbnailYX[3978][0] : thumbnailYX[3857][0])
              .replace('{x}', projection === 3978 ? thumbnailYX[3978][1] : thumbnailYX[3857][1]),
          );
        }
      }
    }

    return thumbnailUrls;
  }

  /**
   * Get basemap information (name and description).
   * @param {string[]} basemapTypes - Basemap layer type (shaded, transport, label, simple).
   * @returns { name: string; description: string } Array with information [name, description].
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
    } else if (basemapTypes.includes('imagery')) {
      name = getLocalizedMessage('basemapPanel.info.imagery.name', language);
    }

    if (basemapTypes.includes('label')) name = `${name} ${getLocalizedMessage('basemapPanel.info.label.name', language)}`;

    return { name, description };
  }
  // #endregion

  /**
   * Update the basemap with the layers on the map.
   * @param {string} basemapId - The id to update the basemap on the map.
   */
  const setBasemap = (basemapId: string): void => {
    // Get basemap from id
    const basemap = basemapList.find((item) => item.basemapId === basemapId);

    // Set the new basemap and update the active basemap variable
    if (basemap !== undefined) {
      myMap.basemap.setBasemap(basemap);
      setActiveBasemapId(basemapId);
    }
  };

  /**
   *  Add basemaps from configuration for selected projection.
   * @param {number} projection - The projection to create basemaps for.
   * @returns {Promise<void>}
   */
  const createBasemapArray = async (projection: TypeValidMapProjectionCodes): Promise<void> => {
    const basemapsArray = toJsonObject(
      (config.supportedProjections as Array<TypeJsonObject>).find((obj: TypeJsonObject) => obj.projectionCode === projection),
    );

    let isInit = false;

    // Reset the basemaps array
    setBasemapList([]);

    // Create the core basemaps
    const coreBasemaps: TypeBasemapProps[] = [];
    for (let basemapIndex = 0; basemapIndex < (basemapsArray.coreBasemaps.length as number); basemapIndex++) {
      const basemapTypes = coreBasemaps.map((listedBasemap) => listedBasemap.type);
      const basemapOptions = basemapsArray.coreBasemaps[basemapIndex] as TypeJsonObject as unknown as TypeBasemapOptions;
      // TODO: Check - Should probably move the await outside of the loop so that all core basemaps start processing in parallel?
      // TO.DOCONT: If doing so, be mindful of the isInit which seems to prioritize the first basemap in the list (and maybe why this await is in the loop?)
      // eslint-disable-next-line no-await-in-loop
      const basemap = await api.maps[mapId].basemap.createCoreBasemap(basemapOptions, projection);
      if (basemap && !basemapTypes.includes(basemap.type)) {
        // Get thumbnail and info (name and description) for core basemap
        const { name, description } = getInfo(basemap.type.split('-'));
        basemap.thumbnailUrl = getThumbnailUrl(basemap.type.split('-'), storeProjection, language);
        basemap.name = name;
        basemap.description = description;

        coreBasemaps.push(basemap);
      }
    }

    // Create the custom config basemap
    const customBasemaps: TypeBasemapProps[] = [];
    for (let basemapIndex = 0; basemapIndex < (basemapsArray.customBasemaps.length as number); basemapIndex++) {
      const customBasemap = basemapsArray.customBasemaps[basemapIndex];
      const basemap = api.maps[mapId].basemap.createCustomBasemap(customBasemap, projection);
      const basemapTypes = customBasemaps.map((listedBasemap) => listedBasemap.type);
      if (basemap && !basemapTypes.includes(basemap.type)) customBasemaps.push(basemap);
    }

    setBasemapList([...coreBasemaps, ...customBasemaps]);

    // Set to previous basemap, if it is in new basemaps
    const prevSetBaseMap = [...customBasemaps, ...coreBasemaps].filter((basemap) => basemap.basemapId === activeBasemapId);
    if (prevSetBaseMap) {
      setBasemap(activeBasemapId);
      isInit = true;
    }

    // If previous basemap does not exist in current projection, init first one
    if (!isInit) setBasemap(basemapList[0] as unknown as string);
  };

  /**
   * Set new projection view and basemap array.
   * @param {SelectChangeEvent} event - Select change element event.
   */
  const setSelectedProjection = (event: SelectChangeEvent<unknown>): void => {
    const projection = event.target.value as TypeValidMapProjectionCodes;

    // Set basemap to no geom to clean up the view
    setBasemap('nogeom');
    setMapProjection(projection as TypeValidMapProjectionCodes);

    createBasemapArray(projection)
      .then(() => {
        // Set projection through map viewer
        myMap.setProjection(projection);
      })
      .catch((error) => {
        // Log
        logger.logPromiseFailed('createBasemapArray in setSelectedProjection in basemap-panel', error);
      });
  };

  /**
   * Load existing basemaps and create new basemaps
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

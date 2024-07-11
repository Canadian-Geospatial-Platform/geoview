// import { TypeBasemapProps } from 'geoview-core/src/geo/layer/basemap/basemap-types';
// import { useMapProjection } from 'geoview-core/src/core/stores/store-interface-and-intial-values/map-state';
// import { useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { Extent } from 'geoview-core/src/api/config/types/map-schema-types';
// import { logger } from 'geoview-core/src/core/utils/logger';
// import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { getSxClasses } from './area-of-interest-style';

interface AoiPanelProps {
  config: TypeAoiProps;
}

interface AoiItem {
  aoiTitle: string;
  imageUrl: string;
  extent: Extent;
}

type AoiListItems = AoiItem[];

type TypeAoiProps = {
  isOpen: boolean;
  aoiList: AoiListItems;
  version: string;
};

export function AoiPanel(props: AoiPanelProps): JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { config } = props;
  const aoiList = config.aoiList as AoiListItems;

  const { cgpv } = window;
  // const myMap = cgpv.api.maps[mapId];

  const { /* api, */ ui /* , react */ } = cgpv;
  const { Card, Box } = ui.elements;

  // const { useState } = react;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state and store values
  // const language = useAppDisplayLanguage();

  // #region PRIVATE UTILITY FUNCTIONS
  // #endregion
  return (
    <Box sx={sxClasses.basemapCard}>
      {aoiList.map((aoiItem: AoiItem, index) => {
        return (
          <Card
            tabIndex={0}
            // onClick={() => setBasemap(basemap.basemapId as string)}
            // onKeyPress={() => setBasemap(basemap.basemapId as string)}
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            title={aoiItem.aoiTitle}
            contentCard={
              // eslint-disable-next-line react/jsx-no-useless-fragment
              <>
                {typeof aoiItem.imageUrl === 'string' && (
                  // eslint-disable-next-line react/no-array-index-key
                  <Box component="img" key={index} src={aoiItem.imageUrl} alt="" className="aoiCardThumbnail" />
                )}
              </>
            }
          />
        );
      })}
    </Box>
  );
}

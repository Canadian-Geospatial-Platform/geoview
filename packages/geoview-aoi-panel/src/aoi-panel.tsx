import type { TypeWindow } from 'geoview-core/core/types/global-types';
import type { Extent } from 'geoview-core/api/types/map-schema-types';
import { Projection } from 'geoview-core/geo/utils/projection';
import { useMapProjectionEPSG, useMapStoreActions } from 'geoview-core/core/stores/store-interface-and-intial-values/map-state';
import { useGeoViewMapId } from 'geoview-core/core/stores/geoview-store';
import { MapEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/map-event-processor';
import { logger } from 'geoview-core/core/utils/logger';
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

export type TypeAoiProps = {
  isOpen: boolean;
  aoiList: AoiListItems;
  version: string;
};

export function AoiPanel(props: AoiPanelProps): JSX.Element {
  const { config } = props;
  const { aoiList } = config;

  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { useCallback } = cgpv.reactUtilities.react;

  const { Card, Box } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  const mapId = useGeoViewMapId();
  const mapProjectionEPSG = useMapProjectionEPSG();
  const { highlightBBox } = useMapStoreActions();

  const handleOnClick = useCallback(
    (aoiItem: AoiItem) => {
      // Log
      logger.logTraceUseCallback('AOI-PANEL - handleOnClick');

      // Project the extent from lonlatto map projection
      const extentInMapProjection = Projection.transformExtentFromProj(
        aoiItem.extent,
        Projection.getProjectionLonLat(),
        Projection.getProjectionFromString(mapProjectionEPSG)
      );

      // Zoom to extent and highlight
      MapEventProcessor.zoomToExtent(mapId, extentInMapProjection, { maxZoom: 14 })
        .then(() => {
          // Highlight
          highlightBBox(extentInMapProjection, false);
        })
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('in zoomToLonLatExtentOrCoordinate', error);
        });
    },
    [mapId, mapProjectionEPSG, highlightBBox]
  );

  return (
    <Box sx={sxClasses.aoiCard}>
      {aoiList.map((aoiItem: AoiItem, index) => {
        return (
          <Card
            tabIndex={0}
            className="aoiCardThumbnail"
            onClick={() => handleOnClick(aoiItem)}
            key={aoiItem.aoiTitle}
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

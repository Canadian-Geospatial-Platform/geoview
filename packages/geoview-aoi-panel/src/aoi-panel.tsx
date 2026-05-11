import type { TypeWindow } from 'geoview-core/core/types/global-types';
import type { Extent } from 'geoview-core/api/types/map-schema-types';
import { Projection } from 'geoview-core/geo/utils/projection';
import { useStoreMapCurrentProjectionEPSG } from 'geoview-core/core/stores/states/map-state';
import { logger } from 'geoview-core/core/utils/logger';
import { getSxClasses } from './area-of-interest-style';
import { useMapController } from 'geoview-core/core/controllers/use-controllers';
import { useTranslation } from 'geoview-core/core/translation/i18n';

/** Props for the AoiPanel component. */
interface AoiPanelProps {
  config: TypeAoiProps;
}

/** Represents a single Area of Interest item. */
interface AoiItem {
  aoiTitle: string;
  imageUrl: string;
  extent: Extent;
}

/** List of Area of Interest items. */
type AoiListItems = AoiItem[];

/** Configuration type for the AOI panel plugin. */
export type TypeAoiProps = {
  isOpen: boolean;
  aoiList: AoiListItems;
  version: string;
};

/**
 * Area of Interest panel component.
 *
 * Displays a grid of cards for each AOI item, allowing the user to zoom and highlight an extent.
 *
 * @param props - The component props
 * @returns The AOI panel element
 */
export function AoiPanel(props: AoiPanelProps): JSX.Element {
  logger.logTraceRender('geoview-aoi-panel/aoi-panel');

  const { config } = props;
  const { aoiList } = config;

  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { useCallback } = cgpv.reactUtilities.react;

  const { Card, Box } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);
  const { t } = useTranslation<string>();

  // Store
  const mapProjectionEPSG = useStoreMapCurrentProjectionEPSG();
  const mapController = useMapController();

  // #region Handlers

  /**
   * Handles when the user clicks on an AOI card.
   */
  const handleOnClick = useCallback(
    (aoiItem: AoiItem): void => {
      // Project the extent from lonlat to map projection
      const extentInMapProjection = Projection.transformExtentFromProj(
        aoiItem.extent,
        Projection.getProjectionLonLat(),
        Projection.getProjectionFromString(mapProjectionEPSG)
      );

      // Zoom to extent and highlight
      mapController
        .zoomToExtent(extentInMapProjection, { maxZoom: 14 })
        .then(() => {
          // Highlight
          mapController.highlightBBox(extentInMapProjection, false);
        })
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('in zoomToLonLatExtentOrCoordinate', error);
        });
    },
    [mapProjectionEPSG, mapController]
  );

  /**
   * Handles keyboard events on AOI cards.
   */
  const handleKeyDown = useCallback(
    (aoiItem: AoiItem) =>
      (event: React.KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOnClick(aoiItem);
        }
      },
    [handleOnClick]
  );

  // #endregion

  return (
    <Box sx={sxClasses.aoiCard}>
      {aoiList.map((aoiItem: AoiItem) => (
        <Card
          key={aoiItem.aoiTitle}
          role="button"
          aria-label={t('aio.zoomToHighlight', { name: aoiItem.aoiTitle })}
          tabIndex={0}
          className="aoiCardThumbnail"
          onClick={() => handleOnClick(aoiItem)}
          onKeyDown={handleKeyDown(aoiItem)}
          title={aoiItem.aoiTitle}
          headerComponent="h3"
          sx={sxClasses.aoiCardButton}
          contentCard={
            typeof aoiItem.imageUrl === 'string' && <Box component="img" src={aoiItem.imageUrl} alt="" className="aoiCardThumbnail" />
          }
        />
      ))}
    </Box>
  );
}

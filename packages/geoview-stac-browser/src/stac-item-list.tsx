import type { SxStyles } from 'geoview-core/ui/style/types';
import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';

import type { StacItem, StacItemDisplayOptions, StacItemInteractions } from './stac-browser-types';
import { StacItemCard } from './stac-item-card';

/** Props for the StacItemList component. */
interface StacItemListProps {
  /** The items to display. */
  items: StacItem[];
  /** Display options shared by all cards. */
  display: StacItemDisplayOptions;
  /** Selection/preview state and callbacks. */
  interactions: StacItemInteractions;
  /** The sx classes object. */
  sxClasses: SxStyles;
}

/**
 * Creates a list of STAC item cards and routes the card events to the item callbacks.
 *
 * @param props - Properties defined in StacItemListProps interface
 * @returns The item list component
 */
export function StacItemList(props: StacItemListProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-stac-browser/stac-item-list');

  const { items, display, interactions, sxClasses } = props;
  const { selectedColors, previewedIds, onToggleSelected, onTogglePreview, onZoom, onOpenDetail } = interactions;
  const { cgpv } = window as TypeWindow;
  const { useCallback } = cgpv.reactUtilities.react;

  // #region Handlers

  /**
   * Handles a selection checkbox change.
   */
  const handleToggleSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const item = items.find((listItem) => listItem.id === event.target.name);
      if (item) onToggleSelected(item);
    },
    [items, onToggleSelected]
  );

  /**
   * Handles a card action button click.
   */
  const handleAction = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      const { itemId, action } = event.currentTarget.dataset;
      const item = items.find((listItem) => listItem.id === itemId);
      if (!item) return;
      if (action === 'zoom') onZoom(item);
      else if (action === 'preview') onTogglePreview(item);
      else if (action === 'detail') onOpenDetail(item);
    },
    [items, onZoom, onTogglePreview, onOpenDetail]
  );

  // #endregion

  return (
    <Box component="ul" sx={sxClasses.itemList}>
      {items.map((item) => (
        <StacItemCard
          key={item.id}
          item={item}
          display={display}
          selectedColor={selectedColors[item.id]}
          isPreviewed={!!previewedIds[item.id]}
          sxClasses={sxClasses}
          onToggleSelected={handleToggleSelected}
          onAction={handleAction}
        />
      ))}
    </Box>
  );
}

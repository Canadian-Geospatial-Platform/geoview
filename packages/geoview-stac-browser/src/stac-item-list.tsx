import type { SxStyles } from 'geoview-core/ui/style/types';
import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';

import type { StacItem, StacItemDisplayOptions, StacItemInteractions } from './stac-browser-types';
import { StacItemCard } from './stac-item-card';
import { StacFieldUtils } from './stac-field-utils';

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
  const { selectedColors, previewedHrefs, onToggleSelected, onTogglePreview, onZoom, onOpenDetail } = interactions;
  const { cgpv } = window as TypeWindow;
  const { useCallback } = cgpv.reactUtilities.react;

  // #region Handlers

  /**
   * Handles a selection checkbox change.
   */
  const handleToggleSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const item = items.find((listItem) => StacFieldUtils.getItemKey(listItem) === event.target.name);
      if (item) onToggleSelected(item);
    },
    [items, onToggleSelected]
  );

  /**
   * Handles a card action button click.
   */
  const handleAction = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      const { itemKey, action } = event.currentTarget.dataset;
      const item = items.find((listItem) => StacFieldUtils.getItemKey(listItem) === itemKey);
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
      {items.map((item) => {
        const itemKey = StacFieldUtils.getItemKey(item);
        return (
          <StacItemCard
            key={itemKey}
            item={item}
            itemKey={itemKey}
            display={display}
            selectedColor={selectedColors[itemKey]}
            isPreviewed={!!previewedHrefs[itemKey]}
            sxClasses={sxClasses}
            onToggleSelected={handleToggleSelected}
            onAction={handleAction}
          />
        );
      })}
    </Box>
  );
}

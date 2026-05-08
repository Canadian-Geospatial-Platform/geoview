import React, { useCallback } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Button, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';

import type { StacItem } from './stac-browser-types';
import { getSxClasses } from './stac-browser-style';

/** Props for the StacResultsList component. */
interface StacResultsListProps {
  /** Array of STAC items to display. */
  items: StacItem[];
  /** Callback when an item is clicked. */
  onItemClick: (item: StacItem) => void;
  /** Whether there are more results to load. */
  hasMore: boolean;
  /** Callback to load more results. */
  onLoadMore: () => void;
}

/**
 * Creates the STAC results list component.
 *
 * @param props - Properties defined in StacResultsListProps interface
 * @returns The results list component
 */
export function StacResultsList(props: StacResultsListProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-stac-browser/stac-results-list');

  const { items, onItemClick, hasMore, onLoadMore } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // #region Handlers

  /**
   * Handles click on a result card, resolving the item from its ID.
   */
  const handleCardClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      const { itemId } = event.currentTarget.dataset;
      const item = items.find((i) => i.id === itemId);
      if (item) onItemClick(item);
    },
    [items, onItemClick]
  );

  /**
   * Handles keyboard activation on a result card.
   */
  const handleCardKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const { itemId } = event.currentTarget.dataset;
        const item = items.find((i) => i.id === itemId);
        if (item) onItemClick(item);
      }
    },
    [items, onItemClick]
  );

  // #endregion

  /**
   * Gets the thumbnail URL from item assets.
   *
   * @param item - The STAC item
   * @returns The thumbnail URL, or undefined if no thumbnail asset exists
   */
  const getThumbnailUrl = useCallback((item: StacItem): string | undefined => {
    if (!item.assets) return undefined;
    const thumbnail = Object.values(item.assets).find((asset) => asset.roles?.includes('thumbnail'));
    return thumbnail?.href;
  }, []);

  /**
   * Gets the display title for an item.
   *
   * @param item - The STAC item
   * @returns The item title string
   */
  const getItemTitle = useCallback((item: StacItem): string => {
    return item.properties.title ?? item.id;
  }, []);

  /**
   * Gets the display datetime for an item.
   *
   * @param item - The STAC item
   * @returns The formatted date string, or empty string if no datetime
   */
  const getItemDatetime = useCallback((item: StacItem): string => {
    const dt = item.properties.datetime ?? item.properties.start_datetime;
    if (!dt) return '';
    return new Date(dt).toLocaleDateString();
  }, []);

  return (
    <Box sx={sxClasses.resultsList}>
      {items.map((item) => {
        const thumbnailUrl = getThumbnailUrl(item);
        return (
          <Box
            key={item.id}
            data-item-id={item.id}
            sx={sxClasses.resultCard}
            onClick={handleCardClick}
            onKeyDown={handleCardKeyDown}
            role="button"
            tabIndex={0}
          >
            {thumbnailUrl && <Box component="img" src={thumbnailUrl} alt={getItemTitle(item)} sx={sxClasses.thumbnail} />}
            <Typography sx={sxClasses.resultTitle}>{getItemTitle(item)}</Typography>
            <Typography sx={sxClasses.resultMeta}>
              {item.collection && `${item.collection} • `}
              {getItemDatetime(item)}
            </Typography>
          </Box>
        );
      })}
      {hasMore && (
        <Box sx={sxClasses.pagination}>
          <Button type="text" variant="outlined" onClick={onLoadMore}>
            {t('stacBrowser.loadMore')}
          </Button>
        </Box>
      )}
    </Box>
  );
}

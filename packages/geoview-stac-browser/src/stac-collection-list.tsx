import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, IconButton, TextField, Typography } from 'geoview-core/ui';
import { SortByAlphaIcon } from 'geoview-core/ui/icons';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';

import type { StacCollection } from './stac-browser-types';
import { StacApiService } from './stac-api-service';
import { getSxClasses } from './stac-browser-style';

/** Props for the StacCollectionList component. */
interface StacCollectionListProps {
  /** Available collections. */
  collections: StacCollection[];
  /** Callback when a collection card is clicked. */
  onCollectionClick: (collection: StacCollection) => void;
}

/**
 * Creates the STAC collection list component for browsing collections.
 *
 * @param props - Properties defined in StacCollectionListProps interface
 * @returns The collection list component
 */
export function StacCollectionList(props: StacCollectionListProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-stac-browser/stac-collection-list');

  const { collections, onCollectionClick } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useMemo, useState } = cgpv.reactUtilities.react;
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  /** Whether alphabetical sort is active. */
  const [sortAsc, setSortAsc] = useState(false);
  /** Search text for filtering collections. */
  const [searchText, setSearchText] = useState('');

  /**
   * Filters and sorts collections based on search text and sort toggle.
   */
  const memoFilteredCollections = useMemo((): StacCollection[] => {
    logger.logTraceUseMemo('STAC-COLLECTION-LIST - memoFilteredCollections', searchText, sortAsc);

    let filtered = collections;
    if (searchText.trim()) {
      const query = searchText.trim().toLowerCase();
      filtered = collections.filter((c) => {
        const title = (c.title ?? c.id).toLowerCase();
        const keywords = c.keywords?.map((k) => k.toLowerCase()) ?? [];
        return title.includes(query) || keywords.some((k) => k.includes(query));
      });
    }

    if (sortAsc) {
      return [...filtered].sort((a, b) => (a.title ?? a.id).localeCompare(b.title ?? b.id));
    }
    return filtered;
  }, [collections, searchText, sortAsc]);

  // #region Handlers

  /**
   * Handles toggling alphabetical sort.
   */
  const handleToggleSort = useCallback((): void => {
    setSortAsc((prev) => !prev);
  }, []);

  /**
   * Handles search input change.
   */
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchText(event.target.value);
  }, []);

  /**
   * Handles click on a collection card.
   */
  const handleCardClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      const { collectionId } = event.currentTarget.dataset;
      const collection = memoFilteredCollections.find((c) => c.id === collectionId);
      if (collection) onCollectionClick(collection);
    },
    [memoFilteredCollections, onCollectionClick]
  );

  /**
   * Handles keyboard activation on a collection card.
   */
  const handleCardKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const { collectionId } = event.currentTarget.dataset;
        const collection = memoFilteredCollections.find((c) => c.id === collectionId);
        if (collection) onCollectionClick(collection);
      }
    },
    [memoFilteredCollections, onCollectionClick]
  );

  // #endregion

  return (
    <Box sx={sxClasses.resultsList}>
      {/* Search box and sort button */}
      <Box sx={sxClasses.browseToolbar}>
        <TextField
          size="small"
          placeholder={t('stacBrowser.searchCollections')}
          value={searchText}
          onChange={handleSearchChange}
          sx={{ flex: 1 }}
        />
        <IconButton
          aria-label={t('stacBrowser.sortAlphabetical')}
          onClick={handleToggleSort}
          size="small"
          sx={{
            color: sortAsc ? theme.palette.geoViewColor.primary.main : theme.palette.geoViewColor.textColor.light[200],
            backgroundColor: sortAsc ? theme.palette.action.selected : 'transparent',
            borderRadius: '4px',
          }}
        >
          <SortByAlphaIcon />
        </IconButton>
      </Box>

      {memoFilteredCollections.map((collection) => {
        const temporal = StacApiService.formatTemporalExtent(collection, true);
        return (
          <Box
            key={collection.id}
            data-collection-id={collection.id}
            sx={sxClasses.collectionCard}
            onClick={handleCardClick}
            onKeyDown={handleCardKeyDown}
            role="button"
            tabIndex={0}
          >
            <Typography sx={sxClasses.collectionTitle}>{collection.title ?? collection.id}</Typography>
            {collection.description && (
              <Typography sx={sxClasses.collectionDescription}>
                {collection.description.length > 150 ? `${collection.description.substring(0, 150)}...` : collection.description}
              </Typography>
            )}
            {temporal && <Typography sx={sxClasses.resultMeta}>{temporal}</Typography>}
            {collection.keywords && collection.keywords.length > 0 && (
              <Box sx={sxClasses.keywordChipsRow}>
                {collection.keywords.slice(0, 5).map((keyword) => (
                  <Box key={keyword} component="span" sx={sxClasses.keywordChip}>
                    {keyword}
                  </Box>
                ))}
                {collection.keywords.length > 5 && (
                  <Box component="span" sx={sxClasses.keywordChip}>
                    +{collection.keywords.length - 5}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

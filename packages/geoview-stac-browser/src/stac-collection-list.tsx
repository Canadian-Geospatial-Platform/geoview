import type { TypeWindow } from 'geoview-core/core/types/global-types';
import type { SxStyles } from 'geoview-core/ui/style/types';
import { Box, ButtonBase, IconButton, TextField, Typography } from 'geoview-core/ui';
import { SortByAlphaIcon } from 'geoview-core/ui/icons';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';

import type { StacCollection, StacDateDisplayOptions } from './stac-browser-types';
import { StacFieldUtils } from './stac-field-utils';
import { getSxClasses } from './stac-browser-style';

/** Props for the StacCollectionList component. */
interface StacCollectionListProps {
  /** Available collections. */
  collections: StacCollection[];
  /** Map date settings used to format the temporal extents. */
  dateDisplay: StacDateDisplayOptions;
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

  const { collections, dateDisplay, onCollectionClick } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useId, useMemo, useState } = cgpv.reactUtilities.react;
  const memoSxClasses = useMemo((): SxStyles => getSxClasses(theme), [theme]);
  const baseId = useId();

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
        const title = StacFieldUtils.getCollectionTitle(c).toLowerCase();
        const keywords = c.keywords?.map((k) => k.toLowerCase()) ?? [];
        return title.includes(query) || keywords.some((k) => k.includes(query));
      });
    }

    if (sortAsc) {
      return [...filtered].sort((a, b) => StacFieldUtils.getCollectionTitle(a).localeCompare(StacFieldUtils.getCollectionTitle(b)));
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
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      const { collectionId } = event.currentTarget.dataset;
      const collection = memoFilteredCollections.find((c) => c.id === collectionId);
      if (collection) onCollectionClick(collection);
    },
    [memoFilteredCollections, onCollectionClick]
  );

  // #endregion

  return (
    <Box sx={memoSxClasses.resultsList}>
      <Typography component="h3" tabIndex={-1} data-stac-view-focus sx={memoSxClasses.visuallyHidden}>
        {t('stacBrowser.collections')}
      </Typography>

      {/* Search box and sort button */}
      <Box sx={memoSxClasses.browseToolbar}>
        <TextField
          size="small"
          label={t('stacBrowser.searchCollections')}
          value={searchText}
          onChange={handleSearchChange}
          sx={memoSxClasses.collectionSearchField}
        />
        <IconButton
          aria-label={t('stacBrowser.sortAlphabetical')}
          aria-pressed={sortAsc}
          onClick={handleToggleSort}
          size="small"
          sx={memoSxClasses.sortToggle}
        >
          <SortByAlphaIcon />
        </IconButton>
      </Box>

      <Box component="ul" sx={memoSxClasses.collectionList}>
        {memoFilteredCollections.map((collection, index) => {
          const temporal = StacFieldUtils.formatTemporalExtent(collection, t('stacBrowser.present'), dateDisplay, true);
          const cardId = `${baseId}-${index}`;
          const describedBy = [
            collection.description && `${cardId}-description`,
            temporal && `${cardId}-temporal`,
            collection.keywords?.length && `${cardId}-keywords`,
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <li key={collection.id}>
              <ButtonBase
                data-collection-id={collection.id}
                sx={memoSxClasses.collectionCard}
                onClick={handleCardClick}
                aria-labelledby={`${cardId}-title`}
                aria-describedby={describedBy || undefined}
              >
                <Typography component="span" id={`${cardId}-title`} sx={memoSxClasses.collectionTitle}>
                  {StacFieldUtils.getCollectionTitle(collection)}
                </Typography>
                {collection.description && (
                  <Typography component="span" id={`${cardId}-description`} sx={memoSxClasses.collectionDescription}>
                    {collection.description.length > 150 ? `${collection.description.substring(0, 150)}...` : collection.description}
                  </Typography>
                )}
                {temporal && (
                  <Typography component="span" id={`${cardId}-temporal`} sx={memoSxClasses.resultMeta}>
                    {temporal}
                  </Typography>
                )}
                {collection.keywords && collection.keywords.length > 0 && (
                  <Box component="span" id={`${cardId}-keywords`} sx={memoSxClasses.keywordChipsRow}>
                    {collection.keywords.slice(0, 5).map((keyword) => (
                      <Box key={keyword} component="span" sx={memoSxClasses.keywordChip}>
                        {keyword}
                      </Box>
                    ))}
                    {collection.keywords.length > 5 && (
                      <Box component="span" sx={memoSxClasses.keywordChip}>
                        +{collection.keywords.length - 5}
                      </Box>
                    )}
                  </Box>
                )}
              </ButtonBase>
            </li>
          );
        })}
      </Box>
    </Box>
  );
}

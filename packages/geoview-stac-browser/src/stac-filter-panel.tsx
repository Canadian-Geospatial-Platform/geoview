import React, { useCallback, useState } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';

import { Box, Button, Checkbox, FormControlLabel, TextField, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { StacLayerHelper } from 'geoview-core/geo/utils/stac-layer-helper';

import type { StacBrowserConfig, StacCollection } from './stac-browser-types';
import { getSxClasses } from './stac-browser-style';

/** Props for the StacFilterPanel component. */
interface StacFilterPanelProps {
  /** Available collections. */
  collections: StacCollection[];
  /** Plugin configuration. */
  config: StacBrowserConfig;
  /** Callback when search is submitted. */
  onSearch: (params: { collections?: string[]; bbox?: [number, number, number, number]; datetime?: string; q?: string }) => void;
  /** The map ID. */
  mapId: string;
}

/**
 * Creates the STAC filter panel component.
 *
 * @param props - Properties defined in StacFilterPanelProps interface
 * @returns The filter panel component
 */
export function StacFilterPanel(props: StacFilterPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-stac-browser/stac-filter-panel');

  const { collections, config, onSearch, mapId } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Get the OL map reference once at component level
  const olMap = cgpv.api.getMapViewer(mapId).map;

  // State
  const [selectedCollections, setSelectedCollections] = useState<string[]>(config.defaults?.collections ?? []);
  const [useMapExtent, setUseMapExtent] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [keyword, setKeyword] = useState('');

  // #region Handlers

  /**
   * Handles collection checkbox toggle.
   */
  const handleCollectionToggle = useCallback((collectionId: string): void => {
    setSelectedCollections((prev) => {
      if (prev.includes(collectionId)) return prev.filter((id) => id !== collectionId);
      return [...prev, collectionId];
    });
  }, []);

  /**
   * Handles the use map extent checkbox change.
   */
  const handleUseMapExtentChange = useCallback((): void => {
    setUseMapExtent((prev) => !prev);
  }, []);

  /**
   * Handles start date input change.
   */
  const handleStartDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setStartDate(event.target.value);
  }, []);

  /**
   * Handles end date input change.
   */
  const handleEndDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setEndDate(event.target.value);
  }, []);

  /**
   * Handles keyword input change.
   */
  const handleKeywordChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setKeyword(event.target.value);
  }, []);

  /**
   * Handles search button click.
   */
  const handleSearchClick = useCallback((): void => {
    const params: { collections?: string[]; bbox?: [number, number, number, number]; datetime?: string; q?: string } = {};

    if (selectedCollections.length > 0) params.collections = selectedCollections;

    if (useMapExtent) {
      // Get the actual map extent transformed to EPSG:4326 for STAC API
      params.bbox = StacLayerHelper.getMapExtentAsWgs84Bbox(olMap);
    }

    if (startDate || endDate) {
      const start = startDate ? `${startDate}T00:00:00Z` : '..';
      const end = endDate ? `${endDate}T23:59:59Z` : '..';
      params.datetime = `${start}/${end}`;
    }

    // Add keyword as free-text query and also filter collections client-side
    if (keyword.trim()) {
      params.q = keyword.trim();
      // Also auto-select collections whose id or title match the keyword (if user hasn't manually selected any)
      if (!params.collections?.length && collections.length > 0) {
        const kw = keyword.trim().toLowerCase();
        const matchingCollections = collections
          .filter((c) => c.id.toLowerCase().includes(kw) || (c.title && c.title.toLowerCase().includes(kw)))
          .map((c) => c.id);
        if (matchingCollections.length > 0) params.collections = matchingCollections;
      }
    }

    onSearch(params);
  }, [selectedCollections, useMapExtent, startDate, endDate, keyword, collections, onSearch, olMap]);

  // #endregion

  return (
    <Box sx={sxClasses.filterPanel}>
      {/* Collection filter */}
      {config.filters?.collections !== false && collections.length > 0 && (
        <Box sx={sxClasses.filterRow}>
          <Typography sx={sxClasses.filterLabel}>{t('stacBrowser.collections')}</Typography>
          <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
            {collections.map((collection) => (
              <FormControlLabel
                key={collection.id}
                control={
                  <Checkbox
                    checked={selectedCollections.includes(collection.id)}
                    onChange={(): void => handleCollectionToggle(collection.id)}
                    size="small"
                  />
                }
                label={collection.title ?? collection.id}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Temporal filter */}
      {config.filters?.temporal !== false && (
        <Box sx={sxClasses.filterRow}>
          <Typography sx={sxClasses.filterLabel}>{t('stacBrowser.temporal')}</Typography>
          <Box sx={sxClasses.dateInputRow}>
            <input type="date" value={startDate} onChange={handleStartDateChange} />
            <Typography>—</Typography>
            <input type="date" value={endDate} onChange={handleEndDateChange} />
          </Box>
        </Box>
      )}

      {/* Spatial filter */}
      {config.filters?.spatial !== false && (
        <Box sx={sxClasses.filterRow}>
          <FormControlLabel
            control={<Checkbox checked={useMapExtent} onChange={handleUseMapExtentChange} size="small" />}
            label={t('stacBrowser.useMapExtent')}
          />
        </Box>
      )}

      {/* Keyword filter */}
      {config.filters?.keyword !== false && (
        <Box sx={sxClasses.filterRow}>
          <TextField size="small" placeholder={t('stacBrowser.keywords')} value={keyword} onChange={handleKeywordChange} fullWidth />
        </Box>
      )}

      {/* Search button */}
      <Button type="text" variant="contained" onClick={handleSearchClick} sx={sxClasses.searchButton}>
        {t('stacBrowser.search')}
      </Button>
    </Box>
  );
}

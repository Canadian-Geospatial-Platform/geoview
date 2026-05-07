import React, { useCallback, useState } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';

import { Box, Button, Checkbox, FormControlLabel, TextField, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { getStoreMapStateJson } from 'geoview-core/core/stores/states/map-state';

import type { StacBrowserConfig, StacCollection } from './stac-browser-types';
import { getSxClasses } from './stac-browser-style';

/** Props for the StacFilterPanel component. */
interface StacFilterPanelProps {
  /** Available collections. */
  collections: StacCollection[];
  /** Plugin configuration. */
  config: StacBrowserConfig;
  /** Callback when search is submitted. */
  onSearch: (params: { collections?: string[]; bbox?: [number, number, number, number]; datetime?: string }) => void;
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

  // State
  const [selectedCollections, setSelectedCollections] = useState<string[]>(config.defaults?.collections ?? []);
  const [useMapExtent, setUseMapExtent] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [keyword, setKeyword] = useState('');

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
    const params: { collections?: string[]; bbox?: [number, number, number, number]; datetime?: string } = {};

    if (selectedCollections.length > 0) params.collections = selectedCollections;

    if (useMapExtent) {
      // Get the current map extent as bbox in EPSG:4326
      // For now, use a simple approach based on map center and zoom
      const mapState = getStoreMapStateJson(mapId);
      const center = mapState.mapCenterCoordinates;
      const zoom = mapState.currentZoom;
      // Approximate bbox from center and zoom level
      const span = 180 / Math.pow(2, zoom);
      params.bbox = [center[0] - span, center[1] - span / 2, center[0] + span, center[1] + span / 2];
    }

    if (startDate || endDate) {
      const start = startDate ? `${startDate}T00:00:00Z` : '..';
      const end = endDate ? `${endDate}T23:59:59Z` : '..';
      params.datetime = `${start}/${end}`;
    }

    onSearch(params);
  }, [selectedCollections, useMapExtent, startDate, endDate, onSearch, mapId]);

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

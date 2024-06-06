import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  TypeColumnFiltersState,
  useDataTableStoreActions,
  useDataTableLayerSettings,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { useTimeSliderLayers } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { useGeoViewConfig } from '@/core/stores/geoview-store';
import { TABS } from '@/core/utils/constant';
import { DateMgt } from '@/core/utils/date-mgt';
import { MappedLayerDataType } from '../data-table-types';

export interface UseFilterRowsProps {
  layerPath: string;
  data: MappedLayerDataType;
}

/**
 * Custom hook to set the filtered row  for data table.
 * @param {string} layerPath key of the layer selected.
 * @returns {Object}
 */
export function useFilterRows({ layerPath, data }: UseFilterRowsProps): {
  columnFilters: TypeColumnFiltersState;
  setColumnFilters: Dispatch<SetStateAction<TypeColumnFiltersState>>;
} {
  const footerBarTabsConfig = useGeoViewConfig()?.footerBar;

  const datatableSettings = useDataTableLayerSettings();
  const timeSliderSettings = useTimeSliderLayers();

  const { setColumnFiltersEntry, setMapFilteredEntry } = useDataTableStoreActions();

  const { columnFiltersRecord } = datatableSettings[layerPath];

  const [columnFilters, setColumnFilters] = useState<TypeColumnFiltersState>(columnFiltersRecord || []);

  // update store column filters
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USEFILTERROWS - columnFilters', columnFilters);

    setColumnFiltersEntry(columnFilters, layerPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

  useEffect(() => {
    // Update the column filter record when footer tabs have time slider and time slider exist in data table .
    if (timeSliderSettings && (footerBarTabsConfig?.tabs?.core ?? []).includes(TABS.TIME_SLIDER) && data?.fieldInfos?.time_slider_date) {
      const { isFilterEnabled, values, filtering } = timeSliderSettings[layerPath] ?? {};

      if (isFilterEnabled) {
        const filtersRecord = columnFiltersRecord.filter((record) => record.id !== 'time_slider_date');
        const newValues = values.map((value) => DateMgt.getDayjsDate(value));
        filtersRecord.push({ id: 'time_slider_date', value: newValues });
        setColumnFilters(filtersRecord);
        if (filtering) {
          setMapFilteredEntry(true, layerPath);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerPath]);

  return { columnFilters, setColumnFilters };
}

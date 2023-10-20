import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Checkbox, MenuItem, Select, SelectChangeEvent, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import { AddIcon, Grid, IconButton, SliderBase } from '@/ui';
import { getSxClasses } from './range-slider-style';
import { AbstractGeoViewVector, EsriDynamic, TypeArrayOfFeatureInfoEntries, api, isEqual } from '@/app';
import { SliderFilterProps } from './range-slider-api';

interface RangeSliderPanelProps {
  mapId: string;
  layerPath: string;
  sliderData: {
    fieldIndices: number[];
    usedFieldTypes: string[];
    usedAliasFields: string[];
    usedOutFields: string[];
    minsAndMaxes: number[][];
    featureInfo: TypeArrayOfFeatureInfoEntries;
    activeSliders: SliderFilterProps[];
  };
}

/**
 * Creates a panel with range sliders
 *
 * @param {RangeSliderPanelProps} RangeSliderPanelProps range slider panel properties
 * @returns {JSX.Element} the slider panel
 */
export function RangeSliderPanel(RangeSliderPanelProps: RangeSliderPanelProps) {
  const { mapId, layerPath, sliderData } = RangeSliderPanelProps;
  const { fieldIndices, usedAliasFields, usedOutFields, minsAndMaxes, usedFieldTypes, activeSliders } = sliderData;
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const [currentFilters, setCurrentFilters] = useState<SliderFilterProps[]>(activeSliders);
  const maxSliders = fieldIndices.length;

  useEffect(() => {
    let filters = '';
    let filterCount = 0;
    let active = 0;
    currentFilters.map((filter) => {
      if (filter.filtering) active++;
      return null;
    });
    currentFilters.forEach((filter) => {
      if (filter.filtering) {
        filterCount++;
        if (usedFieldTypes[filter.filterIndex] === 'date') {
          filters += `${usedOutFields[filter.filterIndex]} >= date '${new Date(filter.values[0]).toISOString()}' and ${
            usedOutFields[filter.filterIndex]
          } <= date '${new Date(filter.values[1]).toISOString()}'`;
        } else
          filters += `${usedOutFields[filter.filterIndex]} >= '${filter.values[0]}' and ${usedOutFields[filter.filterIndex]} <= '${
            filter.values[1]
          }'`;
        if (filterCount < active) filters += ' and ';
      }
    });
    (api.maps[mapId].layer.geoviewLayers[layerPath.split('/')[0]] as AbstractGeoViewVector | EsriDynamic).applyViewFilter(
      layerPath,
      filters
    );
    // Update activeSliders as currentFilters change. To be combined and moved to store
    if (currentFilters.length !== activeSliders.length || currentFilters.every((filter, index) => isEqual(filter, activeSliders[index])))
      sliderData.activeSliders = [...currentFilters];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilters]);

  /**
   * Handles adding an additional slider to panel
   */
  function handleAddSlider(): void {
    let next;
    const filterIndices = currentFilters.map((filter) => filter.filterIndex);
    for (let i = 0; i < maxSliders; i++) {
      if (!filterIndices.includes(i)) {
        next = i;
        break;
      }
    }
    if (currentFilters?.length && next !== undefined) {
      const newFilter = { filterIndex: next, values: minsAndMaxes[next], filtering: true };
      setCurrentFilters([...currentFilters, newFilter]);
    }
  }

  /**
   * Handles a change to the filter slider
   * @param {SelectChangeEvent<string>} event the select change event
   * @param {number} index the index of the filter in the currentFilters array
   */
  function handleFilterChange(event: SelectChangeEvent<string>, index: number): void {
    const filters = [...currentFilters];
    const newIndex = usedOutFields?.indexOf(event.target.value);
    if (newIndex !== -1 && filters[index]) {
      filters[index].filterIndex = newIndex;
      filters[index].values = minsAndMaxes[newIndex];
      filters[index].filtering = true;
    }
    setCurrentFilters(filters);
  }

  /**
   * Handles changes to filter sliders
   * @param {number[]} event the filtering values
   * @param {number} index the index of the filter in the currentFilters array
   */
  function handleSliderChange(event: number[], index: number): void {
    const filters = [...currentFilters];
    if (filters[index]) {
      filters[index].values = event;
    }
    setCurrentFilters(filters);
  }

  /**
   * Handles toggling of the range slider
   * @param {React.ChangeEvent<HTMLInputElement>} event the change event
   * @param {boolean} child the new state of the checkbox
   * @param {number} index the index of the filter in the currentFilters array
   */
  function handleToggleFilter(event: React.ChangeEvent<HTMLInputElement>, child: boolean, index: number): void {
    const filters = [...currentFilters];
    if (filters[index]) {
      filters[index].filtering = child;
    }
    setCurrentFilters(filters);
  }

  /**
   * Renders current layers sliders
   * @returns JSX.Element
   */
  const renderSliderRows = useCallback(() => {
    return (
      <Table sx={sxClasses.table}>
        <TableBody>
          {currentFilters.map((filter, index) => {
            return (
              <TableRow sx={sxClasses.tableRow} key={filter.filterIndex}>
                <TableCell style={{ justifyContent: 'left' }}>
                  <Select value={usedOutFields[filter.filterIndex]} label="Filters" onChange={(event) => handleFilterChange(event, index)}>
                    {fieldIndices.map((fieldIndex, subIndex) => {
                      if (
                        filter.filterIndex === subIndex ||
                        !currentFilters.map((currentFilter) => currentFilter.filterIndex).includes(subIndex)
                      )
                        return (
                          <MenuItem key={fieldIndex} value={usedOutFields[subIndex]}>
                            {usedAliasFields[subIndex]}
                          </MenuItem>
                        );
                      return null;
                    })}
                  </Select>
                </TableCell>
                <TableCell style={{ justifyContent: 'center', minWidth: '280px' }}>
                  <SliderBase
                    style={{ width: '300px' }}
                    min={minsAndMaxes[filter.filterIndex][0]}
                    max={minsAndMaxes[filter.filterIndex][1]}
                    value={filter.values}
                    customOnChange={(event) => handleSliderChange(event as number[], index)}
                  />
                </TableCell>
                <TableCell style={{ justifyContent: 'right' }}>
                  <Checkbox
                    color="primary"
                    checked={filter.filtering}
                    onChange={(event, child) => handleToggleFilter(event, child, index)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow>
            <TableCell>
              <div style={{ marginLeft: '22px' }}>
                <IconButton
                  sx={{ marginLeft: '20px' }}
                  aria-label="add-slider"
                  onClick={() => handleAddSlider()}
                  disabled={currentFilters.length === maxSliders}
                >
                  <AddIcon />
                </IconButton>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilters]);

  return (
    <Grid item md={8} sx={{ paddingLeft: '40px' }}>
      <div style={sxClasses.rightPanelContainer}>
        <Grid container sx={sxClasses.rightPanelBtnHolder}>
          <TableContainer>{renderSliderRows()}</TableContainer>
        </Grid>
      </div>
    </Grid>
  );
}

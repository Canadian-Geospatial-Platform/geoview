import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, Slider, Typography, Checkbox } from '@/ui';
import { getSxClasses } from './time-slider-style';
import { AbstractGeoViewVector, EsriDynamic, TypeFeatureInfoLayerConfig, api, getLocalizedValue } from '@/app';
import { SliderFilterProps } from './time-slider-api';

interface TimeSliderPanelProps {
  mapId: string;
  layerPath: string;
  sliderFilterProps: SliderFilterProps;
}

/**
 * Creates a panel with time sliders
 *
 * @param {TimeSliderPanelProps} TimeSliderPanelProps time slider panel properties
 * @returns {JSX.Element} the slider panel
 */
export function TimeSlider(TimeSliderPanelProps: TimeSliderPanelProps) {
  const { mapId, layerPath, sliderFilterProps } = TimeSliderPanelProps;
  const { range, defaultValue, minAndMax, field, values, filtering } = sliderFilterProps;
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const [checked, setChecked] = useState<boolean>(filtering);
  const layerSchemaTag = api.maps[mapId].layer.registeredLayers[layerPath].schemaTag;
  const [sliderValues, setSliderValues] = useState<number[]>(layerSchemaTag === 'ogcWms' ? [new Date(defaultValue).getTime()] : values);

  let fieldAlias = field;
  const { featureInfo } = api.maps[mapId].layer.registeredLayers[layerPath].source!;
  const { aliasFields, outfields } = featureInfo as TypeFeatureInfoLayerConfig;
  const localizedOutFields = getLocalizedValue(outfields, mapId)?.split(',');
  const localizedAliasFields = getLocalizedValue(aliasFields, mapId)?.split(',');
  const fieldIndex = localizedOutFields ? localizedOutFields.indexOf(field) : -1;
  if (fieldIndex !== -1 && localizedAliasFields?.length === localizedOutFields?.length) fieldAlias = localizedAliasFields![fieldIndex];

  const timeDelta = minAndMax[1] - minAndMax[0];
  const dayDelta = new Date(minAndMax[1]).getDate() - new Date(minAndMax[0]).getDate();
  const yearDelta = new Date(minAndMax[1]).getFullYear() - new Date(minAndMax[0]).getFullYear();
  let timeframe: string | undefined;
  if (dayDelta === 0 && timeDelta < 86400000) timeframe = 'day';
  else if (yearDelta === 0) timeframe = 'year';

  let timeMarks: number[] = [];
  if (range.length < 6) timeMarks = [...minAndMax];
  else if (layerSchemaTag === 'ogcWms') {
    timeMarks = range.map((entry) => new Date(entry).getTime());
  } else {
    timeMarks = [
      minAndMax[0],
      new Date(range[Math.round(range.length / 4)]).getTime(),
      new Date(range[Math.round(range.length / 2)]).getTime(),
      new Date(range[Math.round((3 * range.length) / 4)]).getTime(),
      minAndMax[1],
    ];
  }

  const sliderMarks = [];
  for (let i = 0; i < timeMarks.length; i++) {
    sliderMarks.push({
      value: timeMarks[i],
      label: timeframe
        ? `${
            timeframe === 'day'
              ? new Date(timeMarks[i]).toTimeString().split(' ')[0].replace(/^0/, '')
              : new Date(timeMarks[i]).toISOString().slice(5, 10)
          }`
        : new Date(timeMarks[i]).toISOString().slice(0, 10),
    });
  }

  useEffect(() => {
    if (layerSchemaTag === 'ogcWms') {
      if (checked) {
        const newValue = `${new Date(sliderValues[0]).toISOString().slice(0, new Date(sliderValues[0]).toISOString().length - 5)}Z`;
        const filter = `${field}=date '${newValue}'`;
        (api.maps[mapId].layer.geoviewLayers[layerPath.split('/')[0]] as AbstractGeoViewVector | EsriDynamic).applyViewFilter(
          layerPath,
          filter
        );
      } else {
        const filter = `${field}=date '${defaultValue}'`;
        (api.maps[mapId].layer.geoviewLayers[layerPath.split('/')[0]] as AbstractGeoViewVector | EsriDynamic).applyViewFilter(
          layerPath,
          filter
        );
      }
    } else if (checked) {
      let filter = `${field} >= date '${new Date(sliderValues[0]).toISOString()}'`;
      if (sliderValues.length > 1) {
        filter += ` and ${field} <= date '${new Date(sliderValues[1]).toISOString()}'`;
      }
      (api.maps[mapId].layer.geoviewLayers[layerPath.split('/')[0]] as AbstractGeoViewVector | EsriDynamic).applyViewFilter(
        layerPath,
        filter
      );
    } else {
      let filter = `${field} >= date '${new Date(minAndMax[0]).toISOString()}'`;
      if (sliderValues.length > 1) {
        filter += `and ${field} <= date '${new Date(minAndMax[1]).toISOString()}'`;
      }
      (api.maps[mapId].layer.geoviewLayers[layerPath.split('/')[0]] as AbstractGeoViewVector | EsriDynamic).applyViewFilter(
        layerPath,
        filter
      );
    }
    sliderFilterProps.values = sliderValues;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderValues, checked]);

  function valueLabelFormat(value: number): string {
    if (timeframe === 'day') return new Date(value).toTimeString().split(' ')[0].replace(/^0/, '');
    if (timeframe === 'year') return new Date(value).toISOString().slice(5, 10);
    return new Date(value).toISOString().slice(0, 10);
  }

  return (
    <Grid>
      <div style={sxClasses.rightPanelContainer}>
        <Grid container sx={sxClasses.rightPanelBtnHolder}>
          <Grid item xs={9}>
            <Typography component="div" sx={{ ...sxClasses.panelHeaders, paddingLeft: '20px', textAlign: 'center', paddingTop: '10px' }}>
              {timeframe !== undefined
                ? `${fieldAlias} (${
                    timeframe === 'day' ? new Date(defaultValue).toLocaleDateString() : new Date(defaultValue).getFullYear()
                  })`
                : fieldAlias}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <div style={{ textAlign: 'right', marginRight: '25px' }}>
              <Checkbox checked={checked} onChange={(event, child) => setChecked(child)} />
            </div>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <div style={{ textAlign: 'center', paddingTop: '20px' }}>
            <Slider
              sliderId={layerPath}
              style={{ width: '80%', color: 'primary' }}
              min={minAndMax[0]}
              max={minAndMax[1]}
              value={sliderValues}
              valueLabelFormat={(value) => valueLabelFormat(value)}
              marks={sliderMarks}
              step={layerSchemaTag === 'ogcWms' ? null : 0.1}
              customOnChange={(event) => setSliderValues(event as number[])}
            />
          </div>
        </Grid>
      </div>
    </Grid>
  );
}

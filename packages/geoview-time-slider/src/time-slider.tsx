import { useTheme } from '@mui/material/styles';
import { FormControl, InputLabel, NativeSelect } from '@mui/material';
import { AbstractGeoViewVector, TypeWindow, getLocalizedValue } from 'geoview-core';
import { EsriDynamic, TypeFeatureInfoLayerConfig } from 'geoview-core/src/geo/';
import { getSxClasses } from './time-slider-style';
import { SliderFilterProps } from './index';

/**
 * translations object to inject to the viewer translations
 */
const translations: { [index: string]: { [index: string]: string } } = {
  en: {
    unlockRight: 'Unlock right handle',
    unlockLeft: 'Unlock left handle',
    lockRight: 'Lock right handle',
    lockLeft: 'Lock left handle',
    disableFilter: 'Disable Filtering',
    enableFilter: 'Enable Filtering',
    pauseAnimation: 'Pause animation',
    playAnimation: 'Play animation',
    back: 'Back',
    forward: 'Forward',
    changeDirection: 'Change animation direction',
    timeDelay: 'Animation time delay',
  },
  fr: {
    unlockRight: 'Déverrouiller la poignée droite',
    unlockLeft: 'Déverrouiller la poignée gauche',
    lockRight: 'Verrouiller la poignée droite',
    lockLeft: 'Verrouiller la poignée gauche',
    disableFilter: 'Désactiver le filtrage',
    enableFilter: 'Activer le filtrage',
    pauseAnimation: `Pause de l'animation`,
    playAnimation: `Jouer l'animation`,
    back: 'Retour',
    forward: 'En avant',
    changeDirection: `Changer la direction de l'animation`,
    timeDelay: `Délai d'animation`,
  },
};

interface TimeSliderPanelProps {
  mapId: string;
  layerPath: string;
  sliderFilterProps: SliderFilterProps;
}

const { cgpv } = window as TypeWindow;

/**
 * Creates a panel with time sliders
 *
 * @param {TimeSliderPanelProps} TimeSliderPanelProps time slider panel properties
 * @returns {JSX.Element} the slider panel
 */
export function TimeSlider(TimeSliderPanelProps: TimeSliderPanelProps) {
  const { mapId, layerPath, sliderFilterProps } = TimeSliderPanelProps;
  const { api, react, ui } = cgpv;
  const { useState, useRef, useEffect } = react;
  const {
    Grid,
    Slider,
    Typography,
    Checkbox,
    Tooltip,
    IconButton,
    LockIcon,
    LockOpenIcon,
    ArrowLeftIcon,
    PlayArrowIcon,
    PauseIcon,
    ArrowRightIcon,
    SwitchRightIcon,
    SwitchLeftIcon,
  } = ui.elements;
  const { displayLanguage } = api.maps[mapId];
  const { range, defaultValue, minAndMax, field, singleHandle, values, filtering, delay, locked, reversed } = sliderFilterProps;
  const timeStampRange = range.map((entry) => new Date(entry).getTime());
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const [checked, setChecked] = useState<boolean>(filtering);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playIntervalRef = useRef<number>();
  const [isReversed, setIsReversed] = useState<boolean>(reversed);
  const [isLocked, setIsLocked] = useState<boolean>(locked);
  const layerSchemaTag = api.maps[mapId].layer.registeredLayers[layerPath].schemaTag;
  const [sliderValues, setSliderValues] = useState<number[]>(values);
  // References for play button
  const sliderValueRef = useRef<number>();
  const sliderDeltaRef = useRef<number>();

  const [timeDelay, setTimeDelay] = useState<number>(delay);

  // If the field type has an alias, use that as a label
  let fieldAlias = field;
  const { featureInfo } = api.maps[mapId].layer.registeredLayers[layerPath].source!;
  const { aliasFields, outfields } = featureInfo as TypeFeatureInfoLayerConfig;
  const localizedOutFields = getLocalizedValue(outfields, mapId)?.split(',');
  const localizedAliasFields = getLocalizedValue(aliasFields, mapId)?.split(',');
  const fieldIndex = localizedOutFields ? localizedOutFields.indexOf(field) : -1;
  if (fieldIndex !== -1 && localizedAliasFields?.length === localizedOutFields?.length) fieldAlias = localizedAliasFields![fieldIndex];

  // Check if range occurs in a single day or year
  const timeDelta = minAndMax[1] - minAndMax[0];
  const dayDelta = new Date(minAndMax[1]).getDate() - new Date(minAndMax[0]).getDate();
  const yearDelta = new Date(minAndMax[1]).getFullYear() - new Date(minAndMax[0]).getFullYear();
  let timeframe: string | undefined;
  if (dayDelta === 0 && timeDelta < 86400000) timeframe = 'day';
  else if (yearDelta === 0) timeframe = 'year';

  let timeMarks: number[] = [];
  if (range.length < 6 || singleHandle) timeMarks = timeStampRange;
  else {
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
      // If timeframe is a single day, use time. If it is a single year, drop year from dates.
      label: timeframe
        ? `${timeframe === 'day' ? new Date(timeMarks[i]).toTimeString().split(' ')[0] : new Date(timeMarks[i]).toISOString().slice(5, 10)}`
        : new Date(timeMarks[i]).toISOString().slice(0, 10),
    });
  }

  /**
   * Create labels for values on slider
   *
   * @param {number} value The value of the slider handle
   * @returns {string} A formatted time string or ISO date string
   */
  function valueLabelFormat(value: number): string {
    // If timeframe is a single day, use time. If it is a single year, drop year from dates.
    if (timeframe === 'day') return new Date(value).toTimeString().split(' ')[0].replace(/^0/, '');
    if (timeframe === 'year') return new Date(value).toISOString().slice(5, 10);
    return new Date(value).toISOString().slice(0, 10);
  }

  /**
   * Moves the slider handle(s) back one increment
   */
  function moveBack(): void {
    if (singleHandle) {
      const currentIndex = timeStampRange.indexOf(sliderValues[0]);
      let newIndex: number;
      if (timeStampRange[currentIndex] === minAndMax[0]) newIndex = timeStampRange.length - 1;
      else newIndex = currentIndex - 1;
      setSliderValues([timeStampRange[newIndex]]);
    } else {
      let [leftHandle, rightHandle] = sliderValues;
      // If the current distance between slider handles is more than 1/5th of the range, reduce the difference to 1/5th range
      if (!sliderDeltaRef.current) {
        if (rightHandle - leftHandle > (minAndMax[1] - minAndMax[0]) / 5) {
          sliderDeltaRef.current = (minAndMax[1] - minAndMax[0]) / 5;
          setSliderValues([rightHandle - sliderDeltaRef.current, rightHandle]);
        } else sliderDeltaRef.current = rightHandle - leftHandle;
      }
      // Check for edge cases and then set new slider values
      if (isLocked && isReversed) {
        if (leftHandle === minAndMax[0]) leftHandle = rightHandle;
        leftHandle -= sliderDeltaRef.current;
        if (leftHandle < minAndMax[0]) [leftHandle] = minAndMax;
      } else if (isLocked) {
        rightHandle -= sliderDeltaRef.current!;
        if (rightHandle < leftHandle) rightHandle = leftHandle;
        if (rightHandle === leftHandle) [, rightHandle] = minAndMax;
      } else {
        if (rightHandle > sliderValueRef.current! && leftHandle === sliderValueRef.current) rightHandle = sliderValueRef.current;
        else rightHandle -= sliderDeltaRef.current!;
        if (rightHandle <= minAndMax[0]) [, rightHandle] = minAndMax;
        leftHandle = rightHandle - sliderDeltaRef.current!;
        if (leftHandle < minAndMax[0]) [leftHandle] = minAndMax;
        if (leftHandle < sliderValueRef.current! && rightHandle > sliderValueRef.current!) leftHandle = sliderValueRef.current as number;
      }
      setSliderValues([leftHandle, rightHandle]);
    }
  }

  /**
   * Moves the slider handle(s) forward one increment
   */
  function moveForward(): void {
    if (singleHandle) {
      const currentIndex = timeStampRange.indexOf(sliderValues[0]);
      let newIndex: number;
      if (timeStampRange[currentIndex] === minAndMax[1]) newIndex = 0;
      else newIndex = currentIndex + 1;
      setSliderValues([timeStampRange[newIndex]]);
    } else {
      let [leftHandle, rightHandle] = sliderValues;
      // If the current distance between slider handles is more than 1/5th of the range, reduce the difference to 1/5th range
      if (!sliderDeltaRef.current) {
        if (rightHandle - leftHandle > (minAndMax[1] - minAndMax[0]) / 5) {
          sliderDeltaRef.current = (minAndMax[1] - minAndMax[0]) / 5;
          setSliderValues([leftHandle, leftHandle + sliderDeltaRef.current]);
        } else sliderDeltaRef.current = rightHandle - leftHandle;
      }
      // Check for edge cases and then set new slider values
      if (isLocked && isReversed) {
        leftHandle += sliderDeltaRef.current!;
        if (leftHandle >= rightHandle) [leftHandle] = minAndMax;
      } else if (isLocked) {
        if (rightHandle === minAndMax[1]) rightHandle = leftHandle;
        rightHandle += sliderDeltaRef.current!;
        if (rightHandle > minAndMax[1]) [, rightHandle] = minAndMax;
      } else {
        if (leftHandle < sliderValueRef.current! && rightHandle === sliderValueRef.current) leftHandle = sliderValueRef.current;
        else leftHandle += sliderDeltaRef.current!;
        if (leftHandle >= minAndMax[1]) [leftHandle] = minAndMax;
        rightHandle = leftHandle + sliderDeltaRef.current!;
        if (rightHandle > minAndMax[1]) [, rightHandle] = minAndMax;
        if (rightHandle > sliderValueRef.current! && leftHandle < sliderValueRef.current!) rightHandle = sliderValueRef.current as number;
      }
      setSliderValues([leftHandle, rightHandle]);
    }
  }

  useEffect(() => {
    // TODO move api calls out and handle with store
    // Apply filter to map if active, otherwise use default
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

    // If slider cycle is active, pause before advancing to next increment
    if (isPlaying) {
      if (isReversed) playIntervalRef.current = window.setTimeout(() => moveBack(), timeDelay);
      else playIntervalRef.current = window.setTimeout(() => moveForward(), timeDelay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderValues, checked, isReversed, isLocked]);

  // When slider cycle is activated, advance to first increment without delay
  useEffect(() => {
    if (isPlaying) {
      if (isReversed) moveBack();
      else moveForward();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  function handleBack(): void {
    sliderValueRef.current = isReversed ? sliderValues[1] : sliderValues[0];
    moveBack();
  }

  function handleForward(): void {
    [sliderValueRef.current] = sliderValues;
    moveForward();
  }

  function handleLock(): void {
    clearTimeout(playIntervalRef.current);
    sliderFilterProps.locked = !isLocked;
    setIsLocked(!isLocked);
  }

  function handlePlay(): void {
    clearTimeout(playIntervalRef.current);
    sliderValueRef.current = isReversed ? sliderValues[1] : sliderValues[0];
    setIsPlaying(!isPlaying);
  }

  function handleReverse(): void {
    clearTimeout(playIntervalRef.current);
    sliderFilterProps.reversed = !isReversed;
    setIsReversed(!isReversed);
  }

  function handleSliderChange(event: number | number[]): void {
    clearTimeout(playIntervalRef.current);
    sliderDeltaRef.current = undefined;
    setSliderValues(event as number[]);
  }

  function handleTimeChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    sliderFilterProps.delay = event.target.value as unknown as number;
    setTimeDelay(event.target.value as unknown as number);
  }

  function returnLockTooltip(): string {
    if (isReversed) {
      const text = isLocked ? translations[displayLanguage].unlockRight : translations[displayLanguage].lockRight;
      return text;
    }
    const text = isLocked ? translations[displayLanguage].unlockLeft : translations[displayLanguage].lockLeft;
    return text;
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
              <Tooltip
                title={checked ? translations[displayLanguage].disableFilter : translations[displayLanguage].enableFilter}
                placement="top"
                enterDelay={1000}
              >
                <Checkbox
                  checked={checked}
                  onChange={(event, child) => {
                    setChecked(child);
                    sliderFilterProps.filtering = child;
                    if (!child) {
                      clearInterval(playIntervalRef.current);
                      setIsPlaying(false);
                    }
                  }}
                />
              </Tooltip>
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
              step={singleHandle ? null : 0.1}
              customOnChange={(event) => handleSliderChange(event)}
              key={sliderValues[1] ? sliderValues[1] + sliderValues[0] : sliderValues[0]}
            />
          </div>
        </Grid>
        <Grid item xs={12}>
          <div style={{ textAlign: 'center', paddingTop: '20px' }}>
            {!singleHandle && (
              <IconButton
                aria-label={returnLockTooltip()}
                tooltip={returnLockTooltip()}
                tooltipPlacement="top"
                onClick={() => handleLock()}
              >
                {isLocked ? <LockIcon /> : <LockOpenIcon />}
              </IconButton>
            )}
            <IconButton
              aria-label="Back"
              tooltip="Back"
              tooltipPlacement="top"
              disabled={isPlaying || !checked}
              onClick={() => handleBack()}
            >
              <ArrowLeftIcon />
            </IconButton>
            <IconButton
              aria-label={isPlaying ? translations[displayLanguage].pauseAnimation : translations[displayLanguage].playAnimation}
              tooltip={isPlaying ? translations[displayLanguage].pauseAnimation : translations[displayLanguage].playAnimation}
              tooltipPlacement="top"
              disabled={!checked}
              onClick={() => handlePlay()}
            >
              {!isPlaying ? <PlayArrowIcon /> : <PauseIcon />}
            </IconButton>
            <IconButton
              aria-label={translations[displayLanguage].forward}
              tooltip={translations[displayLanguage].forward}
              tooltipPlacement="top"
              disabled={isPlaying || !checked}
              onClick={() => handleForward()}
            >
              <ArrowRightIcon />
            </IconButton>
            <IconButton
              aria-label={translations[displayLanguage].changeDirection}
              tooltip={translations[displayLanguage].changeDirection}
              tooltipPlacement="top"
              onClick={() => handleReverse()}
            >
              {isReversed ? <SwitchRightIcon /> : <SwitchLeftIcon />}
            </IconButton>
            <FormControl sx={{ width: '150px' }}>
              <InputLabel variant="standard">{translations[displayLanguage].timeDelay}</InputLabel>
              <NativeSelect
                defaultValue={timeDelay}
                inputProps={{
                  name: 'timeDelay',
                  onChange: (event) => handleTimeChange(event),
                }}
              >
                <option value={500}>0.5s</option>
                <option value={750}>0.75s</option>
                <option value={1000}>1.0s</option>
                <option value={1500}>1.5s</option>
                <option value={2000}>2.0s</option>
                <option value={3000}>3.0s</option>
                <option value={5000}>5.0s</option>
              </NativeSelect>
            </FormControl>
          </div>
        </Grid>
      </div>
    </Grid>
  );
}

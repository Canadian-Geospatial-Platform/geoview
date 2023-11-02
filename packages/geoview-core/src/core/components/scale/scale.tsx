import { useContext, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { MapContext } from '@/core/app-start';
import { CheckIcon, Tooltip, Box, Button } from '@/ui';
import { getSxClasses } from './scale-style';
import { useMapScale } from '@/core/stores/map-state';
import { useUIFooterBarExpanded } from '@/core/stores/ui-state';

interface TypeScale {
  scaleId: string;
  label: string;
  borderBottom: boolean;
}

/**
 * Create an element that displays the scale
 *
 * @returns {JSX.Element} created scale element
 */
export function Scale(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal component state
  const [scaleMode, setScaleMode] = useState<number>(0);

  // get the values from store
  const expanded = useUIFooterBarExpanded();
  const scale = useMapScale();

  /**
   * Switch the scale mode
   */
  const switchScale = () => {
    setScaleMode((scaleMode + 1) % 2);
  };

  // set the scales values array
  const scaleValues: TypeScale[] = [
    {
      scaleId: '0',
      label: scale.labelGraphic,
      borderBottom: true,
    },
    {
      scaleId: '1',
      label: scale.labelNumeric,
      borderBottom: false,
    },
  ];

  return (
    <Tooltip title={t('mapnav.scale')!} placement="top">
      <Box sx={{ minWidth: 120 }}>
        <Box id={`${mapId}-scaleControlBar`} sx={sxClasses.scaleControl} />
        <Box id={`${mapId}-scaleControlLine`} sx={sxClasses.scaleControl} />
        <Button onClick={() => switchScale()} type="text" sx={sxClasses.scaleContainer} disableRipple>
          {expanded ? (
            <Box sx={sxClasses.scaleExpandedContainer}>
              {scaleValues.map((value, index) => {
                return (
                  <Box sx={sxClasses.scaleExpandedCheckmarkText} key={value.scaleId}>
                    <CheckIcon sx={{ ...sxClasses.scaleCheckmark, fontSize: 25, opacity: scaleMode === index ? 1 : 0 }} />
                    <Box component="span" sx={{ ...sxClasses.scaleText, borderBottom: !value.borderBottom ? 'none' : '1px solid' }}>
                      {value.label}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Box
              component="span"
              sx={{
                ...sxClasses.scaleText,
                borderBottom: !scaleValues[scaleMode].borderBottom ? 'none' : '1px solid',
                width: !scaleValues[scaleMode].borderBottom ? 'inherit' : scale.lineWidth,
              }}
            >
              {scaleValues[scaleMode].label}
            </Box>
          )}
        </Button>
      </Box>
    </Tooltip>
  );
}

import { useCallback, useEffect, useState, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import {
  List,
  ZoomInSearchIcon,
  Tooltip,
  IconButton,
  Paper,
  Box,
  Typography,
  BrowserNotSupportedIcon,
  HighlightIcon,
  HighlightOutlinedIcon,
} from '@/ui';
import { useDetailsCheckedFeatures, useDetailsStoreActions } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { bufferExtent } from '@/geo/utils/utilities';
import type { TypeFeatureInfoEntry, TypeFieldEntry } from '@/api/types/map-schema-types';
import { FeatureInfoTable } from './feature-info-table';
import { getSxClasses } from './details-style';

interface FeatureInfoProps {
  feature: TypeFeatureInfoEntry;
}

interface FeatureHeaderProps {
  iconSrc: string | undefined;
  name: string;
  hasGeometry: boolean;
  checked: boolean;
  onCheckChange: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onZoomIn: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

// Constants outside component to prevent recreating every render
const HEADER_STYLES = {
  container: {
    p: '0 20px 10px 20px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
} as const;

const PAPER_STYLES = {
  boxShadow: 'none',
  border: 'none',
  paddingTop: '0.5rem',
} as const;

const TYPOGRAPHY_STYLES = {
  display: 'inline-block',
} as const;

const ZOOM_PADDING = [5, 5, 5, 5];
const ZOOM_MAX_LEVEL = 17;
const EXTENT_BUFFER = 1000;

// Extracted Header Component
const FeatureHeader = memo(function FeatureHeader({ iconSrc, name, hasGeometry, checked, onCheckChange, onZoomIn }: FeatureHeaderProps) {
  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  return (
    <Box sx={HEADER_STYLES.container}>
      <Box sx={sxClasses.flexBoxAlignCenter}>
        {iconSrc ? (
          <Box component="img" src={iconSrc} alt={name} className="layer-icon" />
        ) : (
          <Box component="div" aria-label={name} className="layer-icon">
            <BrowserNotSupportedIcon />
          </Box>
        )}
        <Typography sx={TYPOGRAPHY_STYLES} component="div">
          {iconSrc ? (
            (name ?? t('details.nullValue'))
          ) : (
            <>
              {`(${name}) `}
              <Typography component="span" sx={{ fontStyle: 'italic' }}>
                {t('details.notSymbolized')}
              </Typography>
            </>
          )}
        </Typography>
      </Box>
      <Box
        sx={{
          ...sxClasses.flexBoxAlignCenter,
          [theme.breakpoints.down('sm')]: { display: 'none' },
        }}
      >
        <Tooltip title={t('details.keepFeatureSelected')} placement="top" enterDelay={1000}>
          <IconButton
            aria-label={t('details.keepFeatureSelected')}
            tooltipPlacement="top"
            disabled={!hasGeometry}
            onClick={onCheckChange}
            className="buttonOutline"
          >
            {checked ? <HighlightIcon /> : <HighlightOutlinedIcon />}
          </IconButton>
        </Tooltip>
        <IconButton
          color="primary"
          aria-label={t('details.zoomTo')}
          tooltipPlacement="top"
          disabled={!hasGeometry}
          onClick={onZoomIn}
          className="buttonOutline"
        >
          <ZoomInSearchIcon />
        </IconButton>
      </Box>
    </Box>
  );
});

export function FeatureInfo({ feature }: FeatureInfoProps): JSX.Element | null {
  logger.logTraceRender('components/details/feature-info', feature);

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State
  const [checked, setChecked] = useState<boolean>(false);

  // Store
  const checkedFeatures = useDetailsCheckedFeatures();
  const { addCheckedFeature, removeCheckedFeature } = useDetailsStoreActions();
  const { zoomToExtent, highlightBBox, addHighlightedFeature } = useMapStoreActions();

  // Feature data processing
  const featureData = useMemo(() => {
    if (!feature) return null;

    return {
      uid: feature.uid,
      iconSrc: feature.featureIcon,
      name:
        feature.nameField && feature.fieldInfo?.[feature.nameField]?.value
          ? (feature.fieldInfo?.[feature.nameField]?.value as string)
          : 'No name / Sans nom',
      extent: feature.extent,
      geometry: feature.geometry,
      geoviewLayerType: feature.geoviewLayerType,
    };
  }, [feature]);

  // Process feature info list
  const featureInfoList: TypeFieldEntry[] = useMemo(() => {
    if (!feature?.fieldInfo) return [];

    return Object.entries(feature.fieldInfo)
      .filter(([key]) => key !== feature.nameField)
      .map(([fieldName, field]) => ({
        fieldKey: field!.fieldKey,
        value: field!.value,
        dataType: field!.dataType,
        alias:
          feature.geoviewLayerType !== 'ogcWms' && feature.geoviewLayerType !== 'ogcWfs'
            ? field!.alias || fieldName
            : (field!.alias || fieldName).split('.').pop() || '',
        domain: null,
      }));
  }, [feature]);

  // Event Handlers
  const handleFeatureSelectedChange = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      if (!feature) return;

      if (!checked) {
        addCheckedFeature(feature);
      } else {
        removeCheckedFeature(feature);
      }
    },
    [addCheckedFeature, checked, feature, removeCheckedFeature]
  );

  const handleZoomIn = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      if (!featureData?.extent) return;

      // Buffer the extent to avoid zooming too close if it's a point
      const isPoint = featureData.geometry!.getType() === 'Point';
      const zoomExtent = isPoint ? bufferExtent(featureData.extent, EXTENT_BUFFER) : featureData.extent;

      // Zoom to extent and highlight the feature
      zoomToExtent(zoomExtent, { padding: ZOOM_PADDING, maxZoom: ZOOM_MAX_LEVEL })
        .then(() => {
          // Highlight the bounding box
          if (featureData.extent && !isPoint) {
            highlightBBox(featureData.extent, false);
          }
          // Add the current feature to highlights
          addHighlightedFeature(feature);
        })
        .catch((error: unknown) => {
          logger.logPromiseFailed('zoomToExtent in handleZoomIn in FeatureInfoNew', error);
        });
    },
    [featureData, feature, zoomToExtent, highlightBBox, addHighlightedFeature]
  );

  // Effects
  useEffect(() => {
    logger.logTraceUseEffect('FEATURE-INFO - checkedFeatures', checkedFeatures);

    if (!featureData?.uid) return;

    setChecked(checkedFeatures.some((checkedFeature) => checkedFeature?.uid === featureData.uid));
  }, [checkedFeatures, featureData]);

  // Early return if no feature
  if (!featureData) return null;

  return (
    <Paper sx={PAPER_STYLES}>
      <FeatureHeader
        iconSrc={featureData.iconSrc}
        name={featureData.name}
        hasGeometry={!!featureData.geometry && !!featureData.extent && !featureData.extent.includes(Infinity)}
        checked={checked}
        onCheckChange={handleFeatureSelectedChange}
        onZoomIn={handleZoomIn}
      />

      <List sx={sxClasses.featureInfoListContainer}>
        <FeatureInfoTable featureInfoList={featureInfoList} />
      </List>
    </Paper>
  );
}

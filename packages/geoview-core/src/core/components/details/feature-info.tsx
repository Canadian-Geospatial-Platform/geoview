import { useCallback, useEffect, useState, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { getCenter } from 'ol/extent';

import { List, ZoomInSearchIcon, Tooltip, IconButton, Checkbox, Paper, Box, Typography } from '@/ui';
import { useDetailsCheckedFeatures, useDetailsStoreActions } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { delay } from '@/core/utils/utilities';
import { TypeFeatureInfoEntry, TypeFieldEntry, TypeGeometry } from '@/geo/map/map-schema-types';
import { FeatureInfoTable } from './feature-info-table';
import { getSxClasses } from './details-style';

interface FeatureInfoProps {
  feature: TypeFeatureInfoEntry;
}

interface FeatureHeaderProps {
  iconSrc: string;
  name: string;
  hasGeometry: boolean;
  checked: boolean;
  onCheckChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onZoomIn: (e: React.MouseEvent<HTMLButtonElement>) => void;
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

// Extracted Header Component
const FeatureHeader = memo(function FeatureHeader({ iconSrc, name, hasGeometry, checked, onCheckChange, onZoomIn }: FeatureHeaderProps) {
  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <Box sx={HEADER_STYLES.container}>
      <Box sx={sxClasses.flexBoxAlignCenter}>
        <Box component="img" src={iconSrc} alt={name} className="layer-icon" />
        <Typography sx={TYPOGRAPHY_STYLES} component="div">
          {name}
        </Typography>
      </Box>
      <Box
        sx={{
          ...sxClasses.flexBoxAlignCenter,
          [theme.breakpoints.down('sm')]: { display: 'none' },
        }}
      >
        <Tooltip title={t('details.keepFeatureSelected')} placement="top" enterDelay={1000}>
          <Checkbox disabled={!hasGeometry} onChange={onCheckChange} checked={checked} sx={sxClasses.selectFeatureCheckbox} />
        </Tooltip>
        <IconButton color="primary" onClick={onZoomIn} className="buttonOutline">
          <Tooltip title={t('details.zoomTo')} placement="top" enterDelay={1000}>
            <ZoomInSearchIcon />
          </Tooltip>
        </IconButton>
      </Box>
    </Box>
  );
});

export function FeatureInfo({ feature }: FeatureInfoProps): JSX.Element | null {
  logger.logTraceRender('components/details/feature-info');

  // Hooks
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // State
  const [checked, setChecked] = useState<boolean>(false);

  // Store
  const checkedFeatures = useDetailsCheckedFeatures();
  const { addCheckedFeature, removeCheckedFeature } = useDetailsStoreActions();
  const { zoomToExtent, highlightBBox, transformPoints, showClickMarker } = useMapStoreActions();

  // Feature data processing
  const featureData = useMemo(() => {
    if (!feature) return null;

    return {
      uid: feature.geometry ? (feature.geometry as TypeGeometry).ol_uid : null,
      iconSrc: feature.featureIcon.toDataURL(),
      name: feature.nameField ? (feature.fieldInfo?.[feature.nameField]?.value as string) || '' : 'No name',
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
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      e.stopPropagation();
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
    (e: React.MouseEvent<HTMLButtonElement>): void => {
      e.stopPropagation();
      if (!featureData?.extent) return;

      const center = getCenter(featureData.extent);
      const newCenter = transformPoints([center], 4326)[0];

      // Zoom to extent and wait for it to finish
      // TODO: We have the same patch in data-table, see if we should create a reusable custom patch / or cahnge desing
      zoomToExtent(featureData.extent)
        .then(async () => {
          // Typically, the click marker is removed after a zoom, so wait a bit here and re-add it...
          // TODO: Refactor - Zoom ClickMarker - Improve the logic in general of when/if a click marker should be removed after a zoom
          await delay(150);

          // Add (back?) a click marker, and bbox extent who will disapear
          showClickMarker({ lnglat: newCenter });
          highlightBBox(featureData.extent!, false);
        })
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('zoomToExtent in handleZoomIn in FeatureInfoNew', error);
        });
    },
    [featureData, transformPoints, zoomToExtent, showClickMarker, highlightBBox]
  );

  // Effects
  useEffect(() => {
    logger.logTraceUseEffect('FEATURE-INFO - checkedFeatures', checkedFeatures);

    if (!featureData?.uid) return;

    setChecked(checkedFeatures.some((checkedFeature) => (checkedFeature.geometry as TypeGeometry)?.ol_uid === featureData.uid));
  }, [checkedFeatures, featureData]);

  // Early return if no feature
  if (!featureData) return null;

  return (
    <Paper sx={PAPER_STYLES}>
      <FeatureHeader
        iconSrc={featureData.iconSrc}
        name={featureData.name}
        hasGeometry={!!featureData.geometry}
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

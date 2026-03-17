import { useCallback, useEffect, useState, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  BrowserNotSupportedIcon,
  ChartIcon,
  HighlightIcon,
  HighlightOutlinedIcon,
  IconButton,
  Paper,
  Typography,
  ZoomInSearchIcon,
} from '@/ui';
import { useDetailsCheckedFeatures, useDetailsStoreActions } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import {
  useGeochartConfigs,
  useGeochartLayerDataArrayBatch,
  useGeochartStoreActions,
} from '@/core/stores/store-interface-and-intial-values/geochart-state';
import { useNavigateToTab } from '@/core/components/common/hooks/use-navigate-to-tab';
import { logger } from '@/core/utils/logger';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { TypeFeatureInfoEntry, TypeFieldEntry } from '@/api/types/map-schema-types';
import type { TypeContainerBox } from '@/core/types/global-types';
import { FeatureInfoTable } from './feature-info-table';
import { getSxClasses } from './details-style';
import { useUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';

interface FeatureInfoProps {
  feature: TypeFeatureInfoEntry;
  containerType: TypeContainerBox;
}

interface FeatureHeaderProps {
  iconSrc: string | undefined;
  name: string;
  hasGeometry: boolean;
  hasGeochart: boolean;
  checked: boolean;
  onCheckChange: (checked: boolean) => void;
  onZoomIn: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onGeochart: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

// Constants outside component to prevent recreating every render
const HEADER_STYLES = {
  container: {
    p: '0 16px 10px 16px',
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
  overflowWrap: 'anywhere',
} as const;

const ZOOM_PADDING = [5, 5, 5, 5];
const ZOOM_MAX_LEVEL = 17;
const EXTENT_BUFFER = 1000;

// Extracted Header Component
const FeatureHeader = memo(function FeatureHeader({
  iconSrc,
  name,
  hasGeometry,
  hasGeochart,
  checked,
  onCheckChange,
  onZoomIn,
  onGeochart,
}: FeatureHeaderProps) {
  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const isFocusTrap = useUIActiveTrapGeoView();

  /**
   * Handles when the checked button is toggled.
   */
  const handleChecked = useCallback(() => {
    // Callback about the checked state providing the checked information
    onCheckChange(!checked);
  }, [checked, onCheckChange]);

  return (
    <Box sx={HEADER_STYLES.container}>
      <Box sx={sxClasses.flexBoxAlignCenter}>
        {iconSrc ? (
          <Box component="img" src={iconSrc} alt="" className="layer-icon" />
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
        role="group"
        sx={{
          ...sxClasses.flexBoxAlignCenter,
          [theme.breakpoints.down('sm')]: { display: 'none' },
        }}
        aria-label={t('details.featureActions')!}
      >
        {/* Hidden in WCAG mode - keyboard users can Tab to layer panel instead */}
        {hasGeochart && !isFocusTrap && (
          <IconButton
            color="primary"
            aria-label={t('details.selectLayerAndScrollChart')}
            tooltipPlacement="top"
            onClick={onGeochart}
            className="buttonOutline"
            size="small"
          >
            <ChartIcon />
          </IconButton>
        )}
        <IconButton
          aria-label={t('details.keepFeatureSelected')}
          tooltipPlacement="top"
          aria-disabled={!hasGeometry}
          onClick={handleChecked}
          className="buttonOutline"
          size="small"
          aria-pressed={checked}
        >
          {checked ? <HighlightIcon /> : <HighlightOutlinedIcon />}
        </IconButton>
        <IconButton
          color="primary"
          aria-label={t('details.zoomTo')}
          tooltipPlacement="top"
          aria-disabled={!hasGeometry}
          onClick={onZoomIn}
          className="buttonOutline"
          size="small"
        >
          <ZoomInSearchIcon />
        </IconButton>
      </Box>
    </Box>
  );
});

export function FeatureInfo({ feature, containerType }: FeatureInfoProps): JSX.Element | null {
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
  const geochartLayerDataArrayBatch = useGeochartLayerDataArrayBatch();
  const { setSelectedLayerPath } = useGeochartStoreActions() ?? {};
  const geochartConfigs = useGeochartConfigs();

  // Use navigate hook for geochart (only if geochart state exists)
  const navigateToGeochart = useNavigateToTab(
    'geochart',
    setSelectedLayerPath ? (layerPath: string) => setSelectedLayerPath(layerPath) : undefined
  );

  /**
   * Memoize the feature name
   */
  const memoFeatureName = useMemo(() => {
    // Try to get the value at the fieldName
    const value = feature.nameField && (feature.fieldInfo?.[feature.nameField]?.value as string);
    return value ?? 'No name / Sans nom';
  }, [feature]);

  /**
   * Memoize if the feature has a geometry associated with the object
   */
  const memoFeatureHasGeometry = useMemo(() => {
    return !!feature.geometry;
  }, [feature.geometry]);

  /**
   * Memoize the Feature Info list
   */
  const memoFeatureInfoList: TypeFieldEntry[] = useMemo(() => {
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
      }));
  }, [feature]);

  /**
   * Memoize if the feature has a geochart
   */
  const memoHasGeochart = useMemo(() => {
    return (
      !!geochartConfigs?.[feature.layerPath] &&
      (geochartLayerDataArrayBatch?.some((entry) => entry.layerPath === feature.layerPath && (entry.features?.length ?? 0) > 0) ?? false)
    );
  }, [feature.layerPath, geochartConfigs, geochartLayerDataArrayBatch]);

  /**
   * Handles when the feature has been checked/unchecked changes.
   */
  const handleFeatureChecked = useCallback(
    (checkedState: boolean): void => {
      // If feature is checked
      if (checkedState) {
        // Add
        addCheckedFeature(feature);
      } else {
        // Remove
        removeCheckedFeature(feature);
      }
    },
    [feature, addCheckedFeature, removeCheckedFeature]
  );

  /**
   * Handles when the button to zoom in on the feature has been clicked.
   */
  const handleZoomIn = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      if (!feature?.extent) return;

      // Buffer the extent to avoid zooming too close if it's a point
      const isPoint = feature.geometry!.getType() === 'Point';
      const zoomExtent = isPoint ? GeoUtilities.bufferExtent(feature.extent, EXTENT_BUFFER) : feature.extent;

      // Zoom to extent and highlight the feature
      zoomToExtent(zoomExtent, { padding: ZOOM_PADDING, maxZoom: ZOOM_MAX_LEVEL })
        .then(() => {
          // Highlight the bounding box
          if (feature.extent && !isPoint) {
            highlightBBox(feature.extent, false);
          }
          // Add the current feature to highlights
          addHighlightedFeature(feature);
        })
        .catch((error: unknown) => {
          logger.logPromiseFailed('zoomToExtent in handleZoomIn in FeatureInfoNew', error);
        });
    },
    [feature, zoomToExtent, highlightBBox, addHighlightedFeature]
  );

  /**
   * Handles when the button to jump to the chart has been clicked.
   */
  const handleGeochart = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      if (!feature) return;
      navigateToGeochart({ layerPath: feature.layerPath });
    },
    [feature, navigateToGeochart]
  );

  // Effects
  useEffect(() => {
    logger.logTraceUseEffect('FEATURE-INFO - checkedFeatures', checkedFeatures);

    if (!feature?.uid) return;

    setChecked(checkedFeatures.some((checkedFeature) => checkedFeature?.uid === feature.uid));
  }, [checkedFeatures, feature]);

  return (
    <Paper sx={PAPER_STYLES}>
      <FeatureHeader
        iconSrc={feature.featureIcon}
        name={memoFeatureName}
        hasGeometry={memoFeatureHasGeometry}
        hasGeochart={memoHasGeochart}
        checked={checked}
        onCheckChange={handleFeatureChecked}
        onZoomIn={handleZoomIn}
        onGeochart={handleGeochart}
      />

      <Box sx={sxClasses.featureInfoListContainer}>
        <FeatureInfoTable layerPath={feature.layerPath} featureInfoList={memoFeatureInfoList} containerType={containerType} />
      </Box>
    </Paper>
  );
}

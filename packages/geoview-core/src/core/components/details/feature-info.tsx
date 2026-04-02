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
import {
  addStoreDetailsCheckedFeature,
  removeStoreDetailsCheckedFeature,
  useStoreDetailsCheckedFeatures,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import {
  setStoreGeochartSelectedLayerPath,
  useStoreGeochartChartsConfig,
  useStoreGeochartLayerDataArrayBatch,
} from '@/core/stores/store-interface-and-intial-values/geochart-state';
import { useNavigateToTab } from '@/core/components/common/hooks/use-navigate-to-tab';
import { logger } from '@/core/utils/logger';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { TypeFeatureInfoEntry, TypeFieldEntry } from '@/api/types/map-schema-types';
import type { TypeContainerBox } from '@/core/types/global-types';
import { FeatureInfoTable } from './feature-info-table';
import { getSxClasses } from './details-style';
import { useStoreUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useMapController } from '@/core/controllers/use-controllers';

/** Properties for the FeatureInfo component. */
interface FeatureInfoProps {
  /** The feature info entry to display. */
  feature: TypeFeatureInfoEntry;
  /** The container type (appBar or footerBar). */
  containerType: TypeContainerBox;
}

/** Properties for the FeatureHeader component. */
interface FeatureHeaderProps {
  /** The feature icon source URL. */
  iconSrc: string | undefined;
  /** The feature name. */
  name: string;
  /** Whether the feature has geometry. */
  hasGeometry: boolean;
  /** Whether the feature has a geochart. */
  hasGeochart: boolean;
  /** Whether the feature is checked. */
  checked: boolean;
  /** Callback when checked state changes. */
  onCheckChange: (checked: boolean) => void;
  /** Callback when zoom in is clicked. */
  onZoomIn: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Callback when geochart is clicked. */
  onGeochart: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

// Constants outside component to prevent recreating every render
/** Style constants for the feature header container. */
const HEADER_STYLES = {
  container: {
    p: '0 16px 10px 16px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
} as const;

/** Style constants for the Paper wrapper. */
const PAPER_STYLES = {
  boxShadow: 'none',
  border: 'none',
  paddingTop: '0.5rem',
} as const;

/** Style constants for the Typography component. */
const TYPOGRAPHY_STYLES = {
  overflowWrap: 'anywhere',
} as const;

/** Padding values for zoom operations. */
const ZOOM_PADDING = [5, 5, 5, 5];
/** Maximum zoom level for zoom-to-feature. */
const ZOOM_MAX_LEVEL = 17;
/** Buffer distance in meters for point extent. */
const EXTENT_BUFFER = 1000;

/**
 * Creates the feature header component.
 *
 * Memoized to avoid re-rendering unchanged headers in the feature list.
 *
 * @param props - Properties defined in FeatureHeaderProps interface
 * @returns The feature header component
 */
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
  const isFocusTrap = useStoreUIActiveTrapGeoView();

  /**
   * Handles when the checked button is toggled.
   */
  const handleChecked = useCallback((): void => {
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
        <Typography sx={TYPOGRAPHY_STYLES} component="h4" variant="body1">
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

/**
 * Creates the feature info component.
 *
 * @param props - Properties defined in FeatureInfoProps interface
 * @returns The feature info component, or null if no feature
 */
export function FeatureInfo({ feature, containerType }: FeatureInfoProps): JSX.Element | null {
  logger.logTraceRender('components/details/feature-info', feature);

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State
  const [checked, setChecked] = useState<boolean>(false);

  // Store
  const mapId = useStoreGeoViewMapId();
  const checkedFeatures = useStoreDetailsCheckedFeatures();
  const geochartLayerDataArrayBatch = useStoreGeochartLayerDataArrayBatch();
  const geochartConfigs = useStoreGeochartChartsConfig();
  const mapController = useMapController();

  // Use navigate hook for geochart (only if geochart state exists)
  const navigateToGeochart = useNavigateToTab('geochart', setStoreGeochartSelectedLayerPath);

  /**
   * Memoizes the feature name.
   */
  const memoFeatureName = useMemo(() => {
    // Try to get the value at the fieldName
    const value = feature.nameField && (feature.fieldInfo?.[feature.nameField]?.value as string);
    return value ?? 'No name / Sans nom';
  }, [feature]);

  /**
   * Memoizes whether the feature has a geometry.
   */
  const memoFeatureHasGeometry = useMemo(() => {
    return !!feature.geometry;
  }, [feature.geometry]);

  /**
   * Memoizes the feature info list.
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
   * Memoizes whether the feature has a geochart.
   */
  const memoHasGeochart = useMemo(() => {
    return (
      !!geochartConfigs?.[feature.layerPath] &&
      (geochartLayerDataArrayBatch?.some((entry) => entry.layerPath === feature.layerPath && (entry.features?.length ?? 0) > 0) ?? false)
    );
  }, [feature.layerPath, geochartConfigs, geochartLayerDataArrayBatch]);

  /**
   * Handles when the feature checked state changes.
   */
  const handleFeatureChecked = useCallback(
    (checkedState: boolean): void => {
      // If feature is checked
      if (checkedState) {
        // Add
        addStoreDetailsCheckedFeature(mapId, feature);
      } else {
        // Remove
        removeStoreDetailsCheckedFeature(mapId, feature);
      }
    },
    [mapId, feature]
  );

  /**
   * Handles when the zoom-in button is clicked.
   */
  const handleZoomIn = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      if (!feature?.extent) return;

      // Buffer the extent to avoid zooming too close if it's a point
      const isPoint = feature.geometry!.getType() === 'Point';
      const zoomExtent = isPoint ? GeoUtilities.bufferExtent(feature.extent, EXTENT_BUFFER) : feature.extent;

      // Zoom to extent and highlight the feature
      mapController
        .zoomToExtent(zoomExtent, { padding: ZOOM_PADDING, maxZoom: ZOOM_MAX_LEVEL })
        .then(() => {
          // Highlight the bounding box
          if (feature.extent && !isPoint) {
            mapController.highlightBBox(feature.extent, false);
          }
          // Add the current feature to highlights
          mapController.addHighlightedFeature(feature);
        })
        .catch((error: unknown) => {
          logger.logPromiseFailed('zoomToExtent in handleZoomIn in FeatureInfoNew', error);
        });
    },
    [feature, mapController]
  );

  /**
   * Handles when the geochart button is clicked.
   */
  const handleGeochart = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      if (!feature) return;
      navigateToGeochart({ layerPath: feature.layerPath });
    },
    [feature, navigateToGeochart]
  );

  /**
   * Syncs the checked state with the store checkedFeatures.
   */
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

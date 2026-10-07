import { useCallback, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { Box, ButtonBase, Checkbox, Collapse, FormControl, Select, Typography } from '@/ui';
import { CollectionsIcon, ExpandMoreIcon, ExpandLessIcon } from '@/ui';

import { getSxClasses } from './layer-settings-style';
import type { SxStyles } from '@/ui/style/types';
import { useStoreLayerMosaicRule, useStoreLayerAllowedMosaicMethods } from '@/core/stores/states/layer-state';

import type { TypeMosaicMethod, TypeMosaicOperation } from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';
import { useLayerController } from '@/core/controllers/use-controllers';

/** Maps mosaic method keys to their filter name and translation key. */
const METHOD_ENTRIES: Record<string, { name: string; labelKey: string }> = {
  esriMosaicNone: { name: 'None', labelKey: 'layers.settings.mosaicMethodNone' },
  esriMosaicCenter: { name: 'Center', labelKey: 'layers.settings.mosaicMethodCenter' },
  esriMosaicNadir: { name: 'Nadir', labelKey: 'layers.settings.mosaicMethodNadir' },
  esriMosaicViewpoint: { name: 'Viewpoint', labelKey: 'layers.settings.mosaicMethodViewpoint' },
  esriMosaicAttribute: { name: 'ByAttribute', labelKey: 'layers.settings.mosaicMethodAttribute' },
  esriMosaicLockRaster: { name: 'LockRaster', labelKey: 'layers.settings.mosaicMethodLockRaster' },
  esriMosaicNorthwest: { name: 'NorthWest', labelKey: 'layers.settings.mosaicMethodNorthwest' },
  esriMosaicSeamline: { name: 'Seamline', labelKey: 'layers.settings.mosaicMethodSeamline' },
};

/** Maps mosaic operation keys to their translation key. */
const OPERATION_ENTRIES: Record<string, string> = {
  MT_FIRST: 'layers.settings.mosaicOperationFirst',
  MT_LAST: 'layers.settings.mosaicOperationLast',
  MT_MIN: 'layers.settings.mosaicOperationMin',
  MT_MAX: 'layers.settings.mosaicOperationMax',
  MT_MEAN: 'layers.settings.mosaicOperationMean',
  MT_BLEND: 'layers.settings.mosaicOperationBlend',
  MT_SUM: 'layers.settings.mosaicOperationSum',
};

/** Properties for the mosaic rule settings panel. */
interface MosaicRulePanelProps {
  /** The layer path to configure mosaic rules for. */
  layerPath: string;
}

/**
 * Creates the inline mosaic rule settings panel for ArcGIS ImageServer layers.
 *
 * Displays method, operation, and ascending controls directly within
 * the settings panel instead of a floating menu.
 *
 * An ArcGIS ImageServer mosaicRule defines how multiple raster datasets within a mosaic dataset
 * are ordered, mosaicked, and displayed on-the-fly when viewed or queried.
 * It specifies which rasters are included (e.g., by ID or attribute), their sorting order,
 * and how overlapping pixels are resolved (e.g., via blending, maximum, or minimum values).
 *
 * @see {@link https://developers.arcgis.com/javascript/latest/references/core/layers/support/MosaicRule}
 *
 * @param props - Properties defined in MosaicRulePanelProps interface
 * @returns The mosaic rule panel
 */
export function MosaicRulePanel({ layerPath }: MosaicRulePanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/mosaic-rule-selector > MosaicRulePanel');

  // Hooks
  const theme = useTheme();
  const memoSxClasses = useMemo((): SxStyles => {
    return getSxClasses(theme);
  }, [theme]);
  const { t } = useTranslation();

  // Store hooks
  const mosaicRule = useStoreLayerMosaicRule(layerPath);
  const allowedMosaicMethods = useStoreLayerAllowedMosaicMethods(layerPath);
  const layerController = useLayerController();

  // State
  const [expanded, setExpanded] = useState<boolean>(false);

  // Unique ids: the collapse region (aria-controls) and the checkbox
  const baseId = useId();
  const collapseId = `${baseId}-content`;
  const ascendingId = `${baseId}-ascending`;

  // Current values
  const currentMethod = mosaicRule?.mosaicMethod ?? 'esriMosaicNone';
  const currentOperation = mosaicRule?.mosaicOperation ?? 'MT_FIRST';
  const currentAscending = mosaicRule?.ascending ?? true;

  /**
   * Builds the current mosaic method and operation summary.
   */
  const memoSelectionSummary = useMemo((): string => {
    logger.logTraceUseMemo('MOSAIC-RULE-SELECTOR - memoSelectionSummary', currentMethod, currentOperation, t);
    const methodLabel = t(METHOD_ENTRIES[currentMethod]?.labelKey ?? currentMethod);
    const operationLabel = t(OPERATION_ENTRIES[currentOperation] ?? currentOperation);
    return `${methodLabel} · ${operationLabel}`;
  }, [currentMethod, currentOperation, t]);

  // #region Handlers

  /**
   * Handles changes to the mosaic method.
   */
  const handleChangeMethod = useCallback(
    (event: React.ChangeEvent<HTMLInputElement> | (Event & { target: { value: unknown; name: string } })): void => {
      layerController.setLayerMosaicRuleMethod(layerPath, event.target.value as TypeMosaicMethod);
    },
    [layerPath, layerController]
  );

  /**
   * Handles changes to the mosaic operation.
   */
  const handleChangeOperation = useCallback(
    (event: React.ChangeEvent<HTMLInputElement> | (Event & { target: { value: unknown; name: string } })): void => {
      layerController.setLayerMosaicRuleOperation(layerPath, event.target.value as TypeMosaicOperation);
    },
    [layerPath, layerController]
  );

  /**
   * Handles changes to the mosaic ascending option.
   */
  const handleChangeAscending = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      layerController.setLayerMosaicRuleAscending(layerPath, event.target.checked);
    },
    [layerPath, layerController]
  );

  /**
   * Handles expanding or collapsing the mosaic rule settings.
   */
  const handleToggle = useCallback((): void => {
    setExpanded((prev) => !prev);
  }, []);

  // #endregion Handlers

  /**
   * Builds menu items for the available mosaic methods.
   */
  const memoMethodMenuItems = useMemo((): { key: string; item: { value: string; name: string; children: string } }[] => {
    logger.logTraceUseMemo('MOSAIC-RULE-SELECTOR - memoMethodMenuItems', t, allowedMosaicMethods);
    return Object.entries(METHOD_ENTRIES)
      .map(([key, { name, labelKey }]) => ({ key, item: { value: key, name, children: t(labelKey) } }))
      .filter((option) => {
        return !allowedMosaicMethods || allowedMosaicMethods.includes(option.item.name as TypeMosaicMethod);
      });
  }, [t, allowedMosaicMethods]);

  /**
   * Builds menu items for the available mosaic operations.
   */
  const memoOperationMenuItems = useMemo((): { key: string; item: { value: string; children: string } }[] => {
    logger.logTraceUseMemo('MOSAIC-RULE-SELECTOR - memoOperationMenuItems', t);
    return Object.entries(OPERATION_ENTRIES).map(([key, labelKey]) => ({ key, item: { value: key, children: t(labelKey) } }));
  }, [t]);

  return (
    <Box sx={memoSxClasses.settingsSection}>
      <ButtonBase
        sx={memoSxClasses.settingsSectionHeader}
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls={collapseId}
        disableRipple
      >
        <CollectionsIcon fontSize="small" />
        <Box component="span" sx={memoSxClasses.settingsSectionHeaderText}>
          <Typography component="span" sx={memoSxClasses.settingsSectionTitle}>
            {t('layers.settings.updateMosaicRule')}
          </Typography>
          <Typography component="span" variant="body2" color="text.secondary" sx={memoSxClasses.settingsSectionSummary} noWrap>
            {memoSelectionSummary}
          </Typography>
        </Box>
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </ButtonBase>
      <Collapse
        id={collapseId}
        in={expanded}
        sx={expanded ? memoSxClasses.settingsSectionContentExpanded : memoSxClasses.settingsSectionContentCollapsed}
      >
        <Box sx={memoSxClasses.settingsSectionContent}>
          <FormControl fullWidth>
            <Select
              value={currentMethod}
              onChange={handleChangeMethod}
              menuItems={memoMethodMenuItems}
              label={t('layers.settings.mosaicMethod')}
            />
          </FormControl>
          <FormControl fullWidth>
            <Select
              value={currentOperation}
              onChange={handleChangeOperation}
              menuItems={memoOperationMenuItems}
              label={t('layers.settings.mosaicOperation')}
            />
          </FormControl>
          <Box sx={memoSxClasses.settingsAscendingRow}>
            <Checkbox id={ascendingId} checked={currentAscending} onChange={handleChangeAscending} />
            <Box component="label" htmlFor={ascendingId} sx={memoSxClasses.settingsAscendingLabel}>
              {t('layers.settings.ascending')}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

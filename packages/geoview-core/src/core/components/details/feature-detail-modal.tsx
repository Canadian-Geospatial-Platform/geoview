import { useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

import { useDataTableSelectedFeature } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useUIActiveFocusItem, useUIActiveAppBarTab } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useAppShellContainer } from '@/core/stores/store-interface-and-intial-values/app-state';

import { Modal, List, Box, Typography, BrowserNotSupportedIcon } from '@/ui';

import { useUIController } from '@/core/controllers/ui-controller';
import { getSxClasses } from './details-style';
import { FeatureInfoTable } from './feature-info-table';
import type { TypeFieldEntry } from '@/api/types/map-schema-types';
import { logger } from '@/core/utils/logger';
import { TABS, LIGHTBOX_SELECTORS } from '@/core/utils/constant';

/**
 * Creates the lightweight feature detail modal component.
 *
 * @returns The feature detail modal component
 */
export default function FeatureDetailModal(): JSX.Element {
  // Log
  logger.logTraceRender('components/details/feature-detail-modal');

  const { t } = useTranslation();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store function
  const uiController = useUIController();
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const feature = useDataTableSelectedFeature()!;
  const [nameFieldValue, setNameFieldValue] = useState('');
  const shellContainer = useAppShellContainer();

  // Determine which container (appBar or footerBar) the modal is rendered in
  const activeAppBarTab = useUIActiveAppBarTab();
  const containerType = activeAppBarTab.tabId === TABS.DATA_TABLE && activeAppBarTab.isOpen ? 'appBar' : 'footerBar';

  /**
   * Builds the features list to display in the table.
   */
  const memoFeatureInfoList: TypeFieldEntry[] = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DETAILS PANEL - Feature Detail Modal - featureInfoList');

    // Extract value of field info nameField for item symbol description
    const key = feature.nameField;
    setNameFieldValue(key && feature.fieldInfo?.[key]?.value ? (feature.fieldInfo[key].value as string) : '');

    const featureInfo = Object.keys(feature?.fieldInfo ?? {}).map((fieldName) => {
      return {
        fieldKey: feature.fieldInfo[fieldName]!.fieldKey,
        value: feature.fieldInfo[fieldName]!.value,
        dataType: feature.fieldInfo[fieldName]!.dataType,
        alias: feature.fieldInfo[fieldName]!.alias ? feature.fieldInfo[fieldName]!.alias : fieldName,
      };
    });

    // Remove last item who is the geoviewID
    featureInfo.pop();

    return featureInfo;
  }, [feature]);

  return (
    <Modal
      modalId="featureDetailDataTable"
      open={activeModalId === 'featureDetailDataTable' && !!feature}
      onClose={() => {
        // Don't close the modal if the LightBox is open
        // The LightBox will handle its own close and focus restoration
        const lightboxOpen = document.querySelector(LIGHTBOX_SELECTORS.ROOT);
        if (!lightboxOpen) {
          uiController.disableFocusTrap();
        }
      }}
      title={t('details.featureDetailModalTitle')}
      container={shellContainer}
      width="90vw"
      contentModal={
        <>
          <Box display="flex" flexDirection="row" alignItems="center" pb={10}>
            {feature.featureIcon ? (
              <Box component="img" alt="" src={feature.featureIcon} className="layer-icon" />
            ) : (
              <Box component="div" aria-label={feature?.nameField ?? ''} className="layer-icon">
                <BrowserNotSupportedIcon />
              </Box>
            )}
            <Typography sx={{ display: 'inline-block' }} component="div">
              {nameFieldValue}
            </Typography>
          </Box>
          <List sx={sxClasses.featureDetailListContainer}>
            <FeatureInfoTable layerPath={feature.layerPath} featureInfoList={memoFeatureInfoList} containerType={containerType} />
          </List>
        </>
      }
    />
  );
}

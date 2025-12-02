import { useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useDataTableSelectedFeature } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useAppShellContainer } from '@/core/stores/store-interface-and-intial-values/app-state';
import { Modal, List, Box, Typography, BrowserNotSupportedIcon } from '@/ui';
import { getSxClasses } from './details-style';
import { FeatureInfoTable } from './feature-info-table';
import type { TypeFieldEntry } from '@/api/types/map-schema-types';
import { logger } from '@/core/utils/logger';

/**
 * Open lighweight version (no function) of feature detail in modal.
 *
 * @returns {JSX.Element} the feature detail modal component
 */
export default function FeatureDetailModal(): JSX.Element {
  // Log
  logger.logTraceRender('components/details/feature-detail-modal');

  const { t } = useTranslation();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store function
  const { disableFocusTrap } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const feature = useDataTableSelectedFeature()!;
  const [nameFieldValue, setNameFieldValue] = useState('');
  const shellContainer = useAppShellContainer();

  /**
   * Build features list to displayed in table
   */
  const featureInfoList: TypeFieldEntry[] = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DETAILS PANEL - Feature Detail Modal - featureInfoList');

    // Extract value of field info nameField for item symbol description
    const nameFieldValueTmp = feature.fieldInfo[feature.nameField !== null ? feature.nameField : 0];
    setNameFieldValue(nameFieldValueTmp !== undefined ? (nameFieldValueTmp.value as string) : '');

    const featureInfo = Object.keys(feature?.fieldInfo ?? {}).map((fieldName) => {
      return {
        fieldKey: feature.fieldInfo[fieldName]!.fieldKey,
        value: feature.fieldInfo[fieldName]!.value,
        dataType: feature.fieldInfo[fieldName]!.dataType,
        alias: feature.fieldInfo[fieldName]!.alias ? feature.fieldInfo[fieldName]!.alias : fieldName,
        domain: null,
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
      onClose={() => disableFocusTrap()}
      title={t('details.featureDetailModalTitle')}
      container={shellContainer}
      width="90vw"
      height="90vh"
      contentModal={
        <>
          <Box display="flex" flexDirection="row" alignItems="center" pb={10}>
            {feature.featureIcon ? (
              <Box component="img" alt={feature?.nameField ?? ''} src={feature.featureIcon} className="layer-icon" />
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
            <FeatureInfoTable featureInfoList={featureInfoList} />
          </List>
        </>
      }
    />
  );
}

import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useDataTableSelectedFeature } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { Dialog, DialogTitle, DialogContent, DialogActions, List, Button, Box, Typography } from '@/ui';
import { getSxClasses } from './details-style';
import { FeatureInfoTable } from './feature-info-table';
import { TypeFieldEntry } from '@/geo/map/map-schema-types';
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

  /**
   * Build features list to displayed in table
   */
  const featureInfoList: TypeFieldEntry[] = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DETAILS PANEL - Feature Detail Modal - featureInfoList');

    return Object.keys(feature?.fieldInfo ?? {}).map((fieldName) => {
      return {
        fieldKey: feature.fieldInfo[fieldName]!.fieldKey,
        value: feature.fieldInfo[fieldName]!.value,
        dataType: feature.fieldInfo[fieldName]!.dataType,
        alias: feature.fieldInfo[fieldName]!.alias ? feature.fieldInfo[fieldName]!.alias : fieldName,
        domain: null,
      };
    });
  }, [feature]);

  return (
    <Dialog
      open={activeModalId === 'featureDetailDataTable' && !!feature}
      onClose={disableFocusTrap}
      maxWidth="lg"
      disablePortal
      sx={sxClasses.featureDetailModal}
    >
      <DialogTitle>{t('details.featureDetailModalTitle')}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="row" alignItems="center" pb={10}>
          <Box component="img" alt={feature?.nameField ?? ''} src={feature.featureIcon.toDataURL().toString()} className="layer-icon" />
          <Typography sx={{ display: 'inline-block' }} component="div">
            {feature.nameField}
          </Typography>
        </Box>
        <List sx={sxClasses.featureDetailListContainer}>
          <FeatureInfoTable featureInfoList={featureInfoList} />
        </List>
      </DialogContent>
      <DialogActions>
        <Button fullWidth variant="contained" className="buttonOutlineFilled" onClick={disableFocusTrap} type="text" size="small" autoFocus>
          {t('general.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

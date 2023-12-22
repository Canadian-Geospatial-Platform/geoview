/* eslint-disable react/require-default-props */
import { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme, Theme } from '@mui/material/styles';

import { List, ZoomInSearchIcon, Tooltip, IconButton, Checkbox, Paper, Box, Grid, Typography } from '@/ui';
import { TypeFieldEntry, TypeArrayOfFeatureInfoEntries, TypeGeometry } from '@/api/events/payloads';
import { FeatureInfoTable } from './feature-info-table';
import { getSxClasses } from './details-style';
import { useDetailsStoreCheckedFeatures, useDetailsStoreActions } from '@/core/stores/store-interface-and-intial-values/details-state';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

export interface TypeFeatureInfoProps {
  features: TypeArrayOfFeatureInfoEntries;
  currentFeatureIndex: number;
}

/**
 * feature info for a layer list
 *
 * @param {TypeFeatureInfoProps} Feature info properties
 * @returns {JSX.Element} the feature info
 */
export function FeatureInfo({ features, currentFeatureIndex }: TypeFeatureInfoProps): JSX.Element {
  const { t } = useTranslation<string>();

  const theme: Theme & {
    iconImage: React.CSSProperties;
  } = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [checked, setChecked] = useState<boolean>(false);
  const feature = features![currentFeatureIndex];
  const featureUid = feature?.geometry ? (feature.geometry as TypeGeometry).ol_uid : null;
  const featureIconSrc = feature?.featureIcon.toDataURL();
  const nameFieldValue = feature?.nameField ? (feature.fieldInfo[feature.nameField!]!.value as string) : 'No name';

  // states from store
  const checkedFeatures = useDetailsStoreCheckedFeatures();
  const { addCheckedFeature, removeCheckedFeature } = useDetailsStoreActions();
  const { zoomToExtent } = useMapStoreActions();

  const featureInfoList: TypeFieldEntry[] = Object.keys(feature?.fieldInfo ?? {}).map((fieldName) => {
    return {
      fieldKey: feature.fieldInfo[fieldName]!.fieldKey,
      value: feature.fieldInfo[fieldName]!.value,
      dataType: feature.fieldInfo[fieldName]!.dataType,
      alias: feature.fieldInfo[fieldName]!.alias ? feature.fieldInfo[fieldName]!.alias : fieldName,
      domain: null,
    };
  });

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (!checked) {
      addCheckedFeature(feature);
    } else {
      removeCheckedFeature(feature);
    }
  };

  const handleZoomIn = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    zoomToExtent(feature.extent);
  };

  useEffect(() => {
    setChecked(
      checkedFeatures.some((checkedFeature) => {
        return (checkedFeature.geometry as TypeGeometry)?.ol_uid === featureUid;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedFeatures, feature]);

  return (
    <Paper sx={{ boxShadow: 'none' }}>
      <Box sx={{ padding: '20px', flexWrap: 'wrap' }}>
        <Grid container justifyContent="space-between">
          {/* Left side */}
          <Grid
            item
            container
            xs={12}
            md={12}
            lg={6}
            spacing={2}
            justifyContent="space-between"
            sx={{ flexBasis: '100%', alignItems: 'center' }}
          >
            <Grid item xs={1} md={1} sx={{ paddingRight: '10px', height: '35px' }}>
              {/* Image element */}
              <Box sx={{ paddingRight: '10px', width: '35px' }}>
                <img
                  src={featureIconSrc}
                  alt={nameFieldValue}
                  style={{ ...theme.iconImage, marginRight: '10px', width: '35px', height: '35px' }}
                />
              </Box>
            </Grid>
            <Grid item xs={11}>
              {/* Feature value name */}
              <Box sx={{ padding: '5px', flexBasis: '100%' }}>{nameFieldValue}</Box>
            </Grid>
          </Grid>

          {/* Right side */}
          <Grid item container xs={12} md={12} lg={6} spacing={2} sx={{ [theme.breakpoints.down('sm')]: { display: 'none' } }}>
            <Grid item xs={10}>
              {/* Text keep feature highlighted */}
              <Typography
                component="div"
                sx={{
                  marginTop: '3px',
                  [theme.breakpoints.up('md')]: { textAlign: 'right' },
                  [theme.breakpoints.down('md')]: { textAlign: 'left' },
                }}
              >
                {t('details.keepFeatureSelected')}
              </Typography>
            </Grid>
            <Grid item xs={1}>
              {/* Checkbox  */}
              <div style={{ marginTop: '-6px' }}>
                <Checkbox onChange={(e) => handleSelect(e)} checked={checked} sx={sxClasses.selectFeatureCheckbox} />
              </div>
            </Grid>
            <Grid item xs={1}>
              {/* Zoom button */}
              <div>
                <IconButton sx={{ marginTop: '-3px' }} color="primary" onClick={(e) => handleZoomIn(e)}>
                  <Tooltip title={t('details.zoomTo')} placement="top" enterDelay={1000}>
                    <ZoomInSearchIcon />
                  </Tooltip>
                </IconButton>
              </div>
            </Grid>
          </Grid>
        </Grid>
      </Box>

      <List sx={sxClasses.featureInfoListContainer}>
        <FeatureInfoTable featureInfoList={featureInfoList} />
      </List>
    </Paper>
  );
}

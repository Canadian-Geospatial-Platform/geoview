/* eslint-disable react/require-default-props */
import React, { MutableRefObject, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Paper } from '@mui/material';
import { getUid } from 'ol/util';
import { List, ListItem, ListItemText, ZoomInSearchIcon, Tooltip, IconButton, Checkbox } from '@/ui';
import { api } from '@/app';
import {
  featureHighlightPayload,
  clearHighlightsPayload,
  TypeFieldEntry,
  TypeArrayOfFeatureInfoEntries,
  TypeFeatureInfoEntry,
  TypeGeometry,
} from '@/api/events/payloads';
import { EVENT_NAMES } from '@/api/events/event-types';
import { FeatureInfoTable } from './feature-info-table';

const sxClasses = {
  itemText: {
    fontSize: 14,
    noWrap: true,
    '& .MuiListItemText-primary': {
      font: 'normal normal 600 20px/27px Roboto, Helvetica, Arial, sans-serif',
    },
    '& .MuiListItemText-secondary': {
      font: 'normal normal 16px/22px Roboto, Helvetica, Arial, sans-serif',
      color: '#000000',
    },
  },
};

export interface TypeFeatureInfoProps {
  mapId: string;
  features: TypeArrayOfFeatureInfoEntries;
  currentFeatureIndex: number;
  onClearCheckboxes: () => void;
  onFeatureNavigateChange: (checkedFeatures: TypeArrayOfFeatureInfoEntries, currentFeature: TypeFeatureInfoEntry) => void;
  selectedFeatures?: MutableRefObject<string[]>;
  clearAllCheckboxes?: boolean;
}

/**
 * feature info for a layer list
 *
 * @param {TypeFeatureInfoProps} Feature info propetties
 * @returns {JSX.Element} the feature info
 */
export function FeatureInfo({
  mapId,
  features,
  currentFeatureIndex,
  selectedFeatures,
  onClearCheckboxes,
  onFeatureNavigateChange,
  clearAllCheckboxes,
}: TypeFeatureInfoProps): JSX.Element {
  const { t } = useTranslation<string>();
  const [checked, setChecked] = useState<boolean>(false);
  const [checkedFeatures, setCheckedFeatures] = useState<TypeArrayOfFeatureInfoEntries>([]);
  const feature = features[currentFeatureIndex];
  const featureUid = getUid(feature.geometry);
  const featureIconSrc = feature.featureIcon.toDataURL();
  const nameFieldValue = feature.fieldInfo[feature.nameField!]!.value as string;

  const featureInfoList: TypeFieldEntry[] = Object.keys(feature.fieldInfo).map((fieldName) => {
    return {
      fieldKey: feature.fieldInfo[fieldName]!.fieldKey,
      value: feature.fieldInfo[fieldName]!.value,
      dataType: feature.fieldInfo[fieldName]!.dataType,
      alias: feature.fieldInfo[fieldName]!.alias ? feature.fieldInfo[fieldName]!.alias : fieldName,
      domain: null,
    };
  });

  const isFeatureInSelectedFeatures = checkedFeatures.some((obj) => {
    return (obj.geometry as TypeGeometry)?.ol_uid === (feature.geometry as TypeGeometry)?.ol_uid;
  });

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (!checked) {
      setChecked(true);
      setCheckedFeatures((prevValue) => [...prevValue, feature]);
    } else {
      setChecked(false);
      setCheckedFeatures((prevValue) =>
        prevValue.filter((item) => (item.geometry as TypeGeometry)?.ol_uid !== (feature.geometry as TypeGeometry)?.ol_uid)
      );
    }
  };

  const handleZoomIn = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    api.maps[mapId].zoomToExtent(feature.extent);
  };

  useEffect(() => {
    if (checkedFeatures.length !== 0) {
      checkedFeatures.forEach((checkedFeature: TypeFeatureInfoEntry) => {
        api.event.emit(featureHighlightPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, checkedFeature));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedFeatures]);

  useEffect(() => {
    if (selectedFeatures?.current && selectedFeatures.current.indexOf(featureUid) !== -1) {
      setChecked(true);
    } else {
      setChecked(false);
    }
  }, [featureUid, selectedFeatures]);

  // Keep track of current feature change, clear all layers, then highlight current feature
  // this needs to be in condition that don't
  useEffect(() => {
    api.event.emit(featureHighlightPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, feature));
    onFeatureNavigateChange(checkedFeatures, feature);
    // to keep the checkbox checked if current feature is one of selected features
    setChecked(isFeatureInSelectedFeatures);
    // if we haven't checked any featuress, clear the highlight from other features except the one we are currently visiting
    // once we are navigating next and previous feature
    if (checkedFeatures.length === 0) {
      features.forEach((singleFeature, index) => {
        if (index !== currentFeatureIndex) {
          api.event.emit(
            clearHighlightsPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, mapId, getUid(singleFeature.geometry))
          );
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature]);

  useEffect(() => {
    if (clearAllCheckboxes) {
      setCheckedFeatures([]);
      setChecked(false);
      onClearCheckboxes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearAllCheckboxes]);

  return (
    <Paper sx={{ boxShadow: 'none' }}>
      <List sx={{ paddingLeft: '25px', paddingTop: '25px' }}>
        <ListItem
          secondaryAction={
            <>
              <Tooltip title={t('details.select')} placement="top" enterDelay={1000}>
                {/* Fix line below related to checked=false */}
                <Checkbox onChange={(e) => handleSelect(e)} checked={checked} />
              </Tooltip>
              <IconButton color="primary" onClick={(e) => handleZoomIn(e)}>
                <Tooltip title={t('details.zoom_to')} placement="top" enterDelay={1000}>
                  <ZoomInSearchIcon />
                </Tooltip>
              </IconButton>
            </>
          }
        >
          <img src={featureIconSrc} alt={nameFieldValue} style={{ width: '35px', height: '35px' }} />
          <ListItemText sx={sxClasses.itemText} primary={nameFieldValue} />
        </ListItem>
      </List>

      <List sx={{ paddingLeft: '25px', paddingRight: '25px', paddingBottom: '25px' }}>
        <FeatureInfoTable featureInfoList={featureInfoList} />
      </List>
    </Paper>
  );
}

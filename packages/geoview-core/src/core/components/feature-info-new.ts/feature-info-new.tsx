/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/require-default-props */
import React, { MutableRefObject, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Paper } from '@mui/material';
import { getUid } from 'ol/util';
import { List, ListItem, ListItemText, ZoomInSearchIcon, Tooltip, IconButton, Checkbox } from '@/ui';
import { api, TypeFeatureInfoEntry } from '@/app';
import { featureHighlightPayload, clearHighlightsPayload, TypeFieldEntry } from '@/api/events/payloads';
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
  feature: TypeFeatureInfoEntry;
  selectedFeatures?: MutableRefObject<string[]>;
}

/**
 * feature info for a layer list
 *
 * @param {TypeFeatureInfoProps} Object of the propetties for FeatureInfo component
 * @returns {JSX.Element} the feature info
 */
export function FeatureInfo({ mapId, feature, selectedFeatures }: TypeFeatureInfoProps): JSX.Element {
  const { t } = useTranslation<string>();

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

  const [checked, setChecked] = useState<boolean>(false);

  // linkify options
  const linkifyOptions = {
    attributes: {
      title: t('details.external_link'),
    },
    defaultProtocol: 'https',
    format: {
      url: (value: string) => (value.length > 50 ? `${value.slice(0, 40)}…${value.slice(value.length - 10, value.length)}` : value),
    },
    ignoreTags: ['script', 'style', 'img'],
    target: '_blank',
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (!checked) {
      setChecked(true);
      api.event.emit(featureHighlightPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, feature));
    } else {
      setChecked(false);
      api.event.emit(clearHighlightsPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, mapId, featureUid));
    }
  };

  const handleZoomIn = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    api.maps[mapId].zoomToExtent(feature.extent);
  };

  useEffect(() => {
    if (selectedFeatures?.current && selectedFeatures.current.indexOf(featureUid) !== -1) {
      setChecked(true);
    } else {
      setChecked(false);
    }
  }, [featureUid, selectedFeatures]);

  return (
    <Paper sx={{ backgroundColor: checked ? '#FFFAD1' : 'initial' }}>
      <List sx={{ paddingLeft: '25px', paddingTop: '25px' }}>
        <ListItem
          secondaryAction={
            <>
              <Tooltip title={t('details.select')} placement="top" enterDelay={1000}>
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

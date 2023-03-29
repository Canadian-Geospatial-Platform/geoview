/* eslint-disable react/require-default-props */
import React, { useEffect, useState } from 'react';
import { useTheme, Theme } from '@mui/material/styles';
import {
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ExpandMoreIcon,
  ExpandLessIcon,
  ZoomInSearchIcon,
  Tooltip,
  IconButton,
  Box,
} from '../../../ui';
import { api } from '../../../app';
import { TypeFeatureInfoEntry } from '../../../api/events/payloads/get-feature-info-payload';
import { DetailsProps } from './details';

const sxClasses = {
  layerItem: {
    color: 'text.primary',
    padding: 0,
  },
  itemText: {
    fontSize: 14,
    noWrap: true,
  },
  expandableIconContainer: {
    paddingLeft: 10,
  },
  featureInfoItem: {
    display: 'flex',
    width: '100%',
    margin: '5px 0',
  },
  featureInfoItemOdd: {
    display: 'flex',
    width: '100%',
    margin: '5px 0',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  featureInfoItemKey: {
    fontWeight: 'bold',
    fontSize: '0.7em',
    width: '40%',
  },
  featureInfoItemValue: {
    fontSize: '0.7em',
    width: '40%',
  },
};
export interface TypeFeatureProps {
  // eslint-disable-next-line react/no-unused-prop-types
  feature: TypeFeatureInfoEntry;
  startOpen?: boolean;
  detailsSettings: DetailsProps;
}

/**
 * feature info for a layer list
 *
 * @returns {JSX.Element} the feature info
 */
export function FeatureInfo(props: TypeFeatureProps): JSX.Element {
  const { feature, startOpen, detailsSettings } = props;
  const { mapId } = detailsSettings;
  const featureId = `Feature Info ${feature.featureKey}`;
  const featureIconSrc = feature.featureIcon.toDataURL();
  const [isOpen, setOpen] = useState<boolean>(false);
  const featureInfoList = Object.keys(feature.fieldInfo).map((fieldName) => {
    return {
      key: feature.fieldInfo[fieldName]!.alias ? feature.fieldInfo[fieldName]!.alias : fieldName,
      type: feature.fieldInfo[fieldName]!.dataType,
      value: feature.fieldInfo[fieldName]!.value,
    };
  });

  const theme: Theme & {
    iconImg: React.CSSProperties;
  } = useTheme();

  function handleZoomIn(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    api.map(mapId).zoomToExtent(feature.extent);
    setOpen(true);
  }

  useEffect(() => {
    // a list of FeatureInfo with only one element will pass down the startOpen prop
    if (startOpen) {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // todo keep the marker to be showing up
  /*  useEffect(() => {
    api.event.emit(markerDefinitionPayload(api.eventNames.MARKER_ICON.EVENT_MARKER_ICON_SHOW, handlerName, location, {} as TypeJsonObject));
  }, [currentZoom, location, handlerName]);
  */
  return (
    <>
      <ListItem sx={sxClasses.layerItem} onClick={() => setOpen(!isOpen)}>
        <ListItemButton>
          <ListItemIcon>
            <IconButton color="primary">{isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
          </ListItemIcon>
          <ListItemIcon>
            <img alt={featureId} src={featureIconSrc} style={{ ...theme.iconImg, width: '35px', height: '35px' }} />
          </ListItemIcon>
          <Tooltip title={featureId} placement="top" enterDelay={1000}>
            <ListItemText sx={sxClasses.itemText} primary={featureId} />
          </Tooltip>
          <ListItemIcon>
            <IconButton color="primary" onClick={(e) => handleZoomIn(e)}>
              <ZoomInSearchIcon />
            </IconButton>
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Box>
          <List sx={sxClasses.expandableIconContainer}>
            {
              // loop through each layer in the map server
              featureInfoList.map((featureInfoItem, index) => {
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <ListItem key={index} sx={index % 2 > 0 ? sxClasses.featureInfoItem : sxClasses.featureInfoItemOdd}>
                    <Box sx={sxClasses.featureInfoItemKey}>{featureInfoItem.key}</Box>
                    <Box sx={sxClasses.featureInfoItemValue}>{featureInfoItem.value}</Box>
                  </ListItem>
                );
              })
            }
          </List>
        </Box>
      </Collapse>
    </>
  );
}

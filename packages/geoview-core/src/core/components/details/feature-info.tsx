/* eslint-disable react/require-default-props */
import React, { useEffect, useState } from 'react';
import {
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ExpandMoreIcon,
  ExpandLessIcon,
  Tooltip,
  IconButton,
  Box,
} from '../../../ui';
import { TypeFeatureInfoEntry } from '../../../api/events/payloads/get-feature-info-payload';

const sxClasses = {
  details: {
    width: '100%',
  },
  layerItem: {
    color: 'text.primary',
    padding: 0,
  },
  expandableGroup: {
    paddingRight: 0,
    paddingLeft: 28,
  },
  expandableIconContainer: {
    paddingLeft: 10,
  },
  legendIcon: {
    width: 24,
    height: 24,
    background: '#fff',
  },
  solidBackground: {
    background: '#fff',
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
  backgroundStyle?: string;
}

/**
 * feature info for a layer list
 *
 * @returns {JSX.Element} the feature info
 */
export function FeatureInfo(props: TypeFeatureProps): JSX.Element {
  const { feature, startOpen, backgroundStyle } = props;
  const featureId = `Feature Info ${feature.featureKey}`;
  const [isOpen, setOpen] = useState<boolean>(false);
  const featureInfoList = Object.keys(feature.featureInfo).map((featureKey) => {
    return { key: featureKey, value: feature.featureInfo[featureKey] };
  });
  const fontColor = backgroundStyle === 'dark' ? { color: '#fff' } : {};

  useEffect(() => {
    // a list of FeatureInfo with only one element will pass down the startOpen prop
    if (startOpen) {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ListItem sx={{ ...sxClasses.layerItem, ...fontColor }} onClick={() => setOpen(!isOpen)}>
        <ListItemButton>
          <ListItemIcon>
            <IconButton color="primary" sx={fontColor}>
              {!isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </ListItemIcon>
          <Tooltip title={featureId} placement="top" enterDelay={1000}>
            <ListItemText primaryTypographyProps={{ fontSize: 14, noWrap: true }} primary={featureId} />
          </Tooltip>
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

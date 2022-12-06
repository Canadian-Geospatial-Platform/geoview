import React, { useState } from 'react';
// import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import makeStyles from '@mui/styles/makeStyles';
import {
  Collapse,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ExpandMoreIcon,
  ExpandLessIcon,
  Tooltip,
  IconButton,
} from '../../../ui';

import { TypeJsonObject } from '../../types/global-types';

const sxClasses = {
  details: {
    width: '100%',
    // maxWidth: 350, // for testing panel width
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
};

const useStyles = makeStyles(() => ({
  featureInfoContainer: {
    width: '100%',
  },
  featureInfoHeader: {
    display: 'flex',
    alignItems: 'center',
  },
  featureInfoHeaderIconContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '32px',
    minWidth: '32px',
    height: '32px',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 20%), 0 1px 1px 0 rgb(0 0 0 / 14%), 0 2px 1px -1px rgb(0 0 0 / 12%)',
  },
  featureInfoHeaderIcon: {},
  featureInfoHeaderText: {
    marginLeft: '10px',
    width: '100%',
    fontSize: 18,
  },
  featureInfoItemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 20,
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
    backgroundColor: '#ddd',
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
}));

export interface TypeFeatureProps {
  // eslint-disable-next-line react/no-unused-prop-types
  key: number;
  feature: TypeJsonObject;
}
/**
 * Legend Item for a Legend list
 *
 * @returns {JSX.Element} the legend list item
 */
export function FeatureInfo(props: TypeFeatureProps): JSX.Element {
  const { feature } = props;
  const [isOpen, setOpen] = useState<boolean>(false);
  const classes = useStyles();
  return (
    <>
      <ListItem sx={sxClasses.layerItem} onClick={() => setOpen(!isOpen)}>
        <ListItemButton>
          <ListItemIcon>
            <IconButton color="primary">{!isOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}</IconButton>
          </ListItemIcon>
          <Tooltip title={feature.OBJECTID} placement="top" enterDelay={1000}>
            <ListItemText primaryTypographyProps={{ fontSize: 14, noWrap: true }} primary={feature.OBJECTID} />
          </Tooltip>
        </ListItemButton>
      </ListItem>
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Box>
          <Box sx={sxClasses.expandableIconContainer}>
            {
              // loop through each layer in the map server
              Object.keys(feature).map((featureKey, index) => {
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={index} className={index % 2 > 0 ? classes.featureInfoItem : classes.featureInfoItemOdd}>
                    <span className={classes.featureInfoItemKey}>{featureKey}</span>
                    <span className={classes.featureInfoItemValue}>{feature[featureKey]}</span>
                  </div>
                );
              })
            }
          </Box>
        </Box>
      </Collapse>
    </>
  );
}

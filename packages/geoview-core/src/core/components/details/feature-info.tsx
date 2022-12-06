import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import makeStyles from '@mui/styles/makeStyles';
import {
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CloseIcon,
  ExpandMoreIcon,
  ExpandLessIcon,
  TodoIcon,
  ListAltIcon,
  Tooltip,
  VisibilityIcon,
  VisibilityOffIcon,
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
  feature: TypeJsonObject;
  isOpen: boolean;
  setOpen: () => void;
}
/**
 * Legend Item for a Legend list
 *
 * @returns {JSX.Element} the legend list item
 */
export function FeatureInfo(props: TypeJsonObject): JSX.Element {
  const { feature } = props;
  const [isOpen, setOpen] = useState<boolean>(false);
  const classes = useStyles();
  return (
    <>
      <ListItem sx={sxClasses.layerItem} onClick={() => setOpen(!isOpen)}>
        <ListItemButton>
        <Tooltip title={feature['OBJECTID']} placement="top" enterDelay={1000}>
          <ListItemText primaryTypographyProps={{ fontSize: 14, noWrap: true }} primary={feature['OBJECTID']} />
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
              <div key={index} className={index%2 > 0 ? classes.featureInfoItem : classes.featureInfoItemOdd} >
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
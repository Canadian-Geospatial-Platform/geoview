import React from 'react';

import makeStyles from '@mui/styles/makeStyles';
import { Tooltip } from '../../../ui';

const useStyles = makeStyles((theme) => ({
  listIconLabel: {
    paddingLeft: 20,
    fontSize: 14,
    noWrap: true,
    color: theme.palette.text.primary,
  },
}));

export interface TypeLegendIconListProps {
  iconImages: string[];
  iconLabels: string[];
}
/**
 * List of Icons to show in expanded Legend Item
 *
 * @returns {JSX.Element} the list of icons
 */
export function LegendIconList(props: TypeLegendIconListProps): JSX.Element {
  const classes = useStyles();

  const { iconImages, iconLabels } = props;

  return (
    <>
      {iconImages.map((icon, index) => {
        return (
          <div key={`icon-${iconLabels[index]}`}>
            <div style={{ display: 'inline-flex' }}>
              <Tooltip title={iconLabels[index]} enterDelay={1000}>
                <div>
                  <img alt={iconLabels[index]} src={icon} />
                  <span className={classes.listIconLabel}>{iconLabels[index]}</span>
                </div>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </>
  );
}

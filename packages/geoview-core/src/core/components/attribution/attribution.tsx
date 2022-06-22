import React, { useContext, useEffect, useState } from 'react';

import OLAttribution from 'ol/control/Attribution';

import makeStyles from '@mui/styles/makeStyles';

import { MapContext } from '../../app-start';
import { api } from '../../../app';

const useStyles = makeStyles((theme) => ({
  attributionContainer: {
    display: 'flex',
    padding: theme.spacing(0, 4),
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    alignItems: 'center',
  },
  attributionText: {
    fontSize: theme.typography.subtitle2.fontSize,
    color: theme.palette.primary.light,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
}));

type AttributionProps = {
  attribution: string;
};

/**
 * Create an Attribution component that will display an attribution box
 * with the attribution text
 * @param {AttributionProps} props attribution properties to get the attribution text
 */
export function Attribution(props: AttributionProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const { attribution } = props;

  const classes = useStyles();

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  const expandAttribution = () => {
    const attributionText = document.getElementById(`${mapId}-attribution-text`) as HTMLElement;

    const attributionList = attributionText.querySelector('li');

    console.log(attributionList);
  };

  const collapseAttribution = () => {
    const attributionText = document.getElementById(`${mapId}-attribution-text`) as HTMLElement;
  };

  useEffect(() => {
    const { map } = api.map(mapId);

    const attributionText = document.getElementById(`${mapId}-attribution-text`) as HTMLElement;

    const attributionControl = new OLAttribution({
      target: attributionText,
      collapsible: false,
    });

    map.addControl(attributionControl);

    console.log(document.getElementById(`${mapId}-attribution-text`).getElementsByTagName('li'));
  }, []);

  return (
    <div className={classes.attributionContainer}>
      <span id={`${mapId}-attribution-text`} className={classes.attributionText} />
    </div>
  );
}

import { useContext, useEffect } from 'react';

import makeStyles from '@mui/styles/makeStyles';

import { MapContext } from '../../app-start';
import { api } from '../../../app';

import { List } from '../../../ui';
import { LegendItem } from './legend-item';

export const useStyles = makeStyles((theme) => ({
  legend: {
    width: '100%',
    // maxWidth: 360,
  },
}));

/**
 * The Legend component is used to display a list of layers and their content.
 *
 * @returns {JSX.Element} returns the Footer Tabs component
 */
export function Legend(): JSX.Element | null {
  const mapConfig = useContext(MapContext);
  const mapId = mapConfig.id;
  const classes = useStyles();

  const createLegendComponent = () => {
    const vectors = api.map(mapId).layer.vector;
    const { layers } = api.map(mapId).layer;
    return (
      <div>
        <List className={classes.legend}>
          {vectors && vectors.geometries?.length > 0 ? <LegendItem layerId="vector" lyr={layers.vector} /> : null}
          {Object.keys(layers).map((layerId) => {
            return <LegendItem key={layerId} layerId={layerId} lyr={layers[layerId]} />;
          })}
        </List>
      </div>
    );
  };

  const { footerTabs } = api.map(mapId);
  useEffect(() => {
    footerTabs.createFooterTab({
      value: 0,
      label: 'Legend',
      content: createLegendComponent,
    });
  }, []);

  // content is added to a tab
  // return createLegendComponent();
  return null;
}

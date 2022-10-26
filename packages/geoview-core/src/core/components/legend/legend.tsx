import { useContext, useEffect } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { MapContext } from '../../app-start';
import { api } from '../../../app';
import { List } from '../../../ui';
import { LegendItem } from './legend-item';

export const useStyles = makeStyles((theme) => ({
  legend: {
    width: '100%',
    // maxWidth: 350, // for testing panel width
  },
}));

/**
 * The Legend component is used to display a list of layers and their content.
 *
 * @returns {JSX.Element} returns the Legend component
 */
export function Legend(): JSX.Element | null {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;
  const classes = useStyles();

  const createLegendComponent = () => {
    const { geoviewLayers } = api.map(mapId).layer;
    return (
      <div>
        <List className={classes.legend}>
          {Object.keys(geoviewLayers).map((layerId) => {
            return <LegendItem key={layerId} layerId={layerId} rootGeoViewLayer={geoviewLayers[layerId]} />;
          })}
        </List>
      </div>
    );
  };

  return createLegendComponent();
}

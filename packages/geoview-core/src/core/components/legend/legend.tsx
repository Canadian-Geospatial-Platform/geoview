import { useContext } from 'react';
import { MapContext } from '../../app-start';
import { api } from '../../../app';
import { List } from '../../../ui';
import { LegendItem } from './legend-item';

const sxStyles = {
  legend: {
    width: '100%',
    // maxWidth: 350, // for testing panel width
  },
};

/**
 * The Legend component is used to display a list of layers and their content.
 *
 * @returns {JSX.Element} returns the Legend component
 */
export function Legend(): JSX.Element | null {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const createLegendComponent = () => {
    const { geoviewLayers } = api.map(mapId).layer;
    return (
      <div>
        <List sx={sxStyles.legend}>
          {Object.keys(geoviewLayers).map((layerId) => {
            return <LegendItem key={layerId} layerId={layerId} rootGeoViewLayer={geoviewLayers[layerId]} />;
          })}
        </List>
      </div>
    );
  };

  return createLegendComponent();
}

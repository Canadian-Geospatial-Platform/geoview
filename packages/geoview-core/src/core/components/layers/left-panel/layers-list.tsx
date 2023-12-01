import { Dispatch, SetStateAction } from 'react';
import { useTheme } from '@mui/material/styles';

import { SingleLayer } from './single-layer';
import { getSxClasses } from './left-panel-styles';
import { List } from '@/ui';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TypeLegendLayer } from '../types';

interface LayerListProps {
  depth: number,
  layersList: TypeLegendLayer[],
  setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
}

export function LayersList({ layersList, setIsLayersListPanelVisible, depth }: LayerListProps): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const listSxClass = depth === 0 ? sxClasses.list : (depth % 2 ? sxClasses.evenDepthList : sxClasses.oddDepthList);


  const legendItems = layersList.map((details) => {
    return (
      <SingleLayer
        key={`layerKey-${details.layerPath}-${details.layerPath}`}
        depth={depth}
        layer={details}
        setIsLayersListPanelVisible={setIsLayersListPanelVisible}
      />
    );
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <List sx={listSxClass}>{legendItems}</List>
    </DndProvider>
  );
}

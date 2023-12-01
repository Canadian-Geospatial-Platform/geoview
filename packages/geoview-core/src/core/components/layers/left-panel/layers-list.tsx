import { Dispatch, SetStateAction } from 'react';
import { useTheme } from '@mui/material/styles';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import SingleLayer from './single-layer';
import { getSxClasses } from './left-panel-styles';
import { List } from '@/ui';
import { TypeLegendLayer } from '../types';

interface LayerListProps {
  depth: number;
  layersList: TypeLegendLayer[];
  setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
}

export function LayersList({ layersList, setIsLayersListPanelVisible, depth }: LayerListProps): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
    }

    /* const items = reorder(
      this.state.items,
      result.source.index,
      result.destination.index
    );

    this.setState({
      items
    }); */
  };

  const getListClass = () => {
    if (depth === 0) {
      return sxClasses.list;
    }
    if (depth % 2) {
      return sxClasses.evenDepthList;
    }
    return sxClasses.oddDepthList;
  };

  const legendItems = layersList.map((details, index) => {
    return (
      <Draggable key={details.layerId} draggableId={details.layerPath} index={index}>
        {(provided) => (
          <SingleLayer
            key={`layerKey-${details.layerPath}-${details.layerPath}`}
            depth={depth}
            layer={details}
            setIsLayersListPanelVisible={setIsLayersListPanelVisible}
            ref={provided.innerRef}
            {...provided.draggableProps}
          />
        )}
      </Draggable>
    );
  });

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="list">
        {(provided) => (
          <List sx={getListClass()} {...provided.droppableProps} ref={provided.innerRef}>
            {legendItems}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  );
}

import { Dispatch, SetStateAction } from 'react';
import { useTheme } from '@mui/material/styles';
import { DragDropContext, Droppable, Draggable, DropResult, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd';
import { SingleLayer } from './single-layer';
import { getSxClasses } from './left-panel-styles';
import { Box } from '@/ui';
import { TypeLegendLayer } from '../types';
import { useLayersDisplayState } from '@/core/stores/store-interface-and-intial-values/layer-state';

interface LayerListProps {
  depth: number;
  parentLayerPath: string;
  layersList: TypeLegendLayer[];
  setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
}

export function LayersList({ layersList, setIsLayersListPanelVisible, parentLayerPath, depth }: LayerListProps): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const displayState = useLayersDisplayState();

  const isDragEnabled = displayState === 'order';

  const sortedLayers = layersList
    .filter((layer) => layer.isVisible !== 'no')
    .sort((a, b) => (a.order && b.order && a.order > b.order ? 1 : -1));

  const onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    console.log(result);
    /* const items = reorder(
      this.state.items,
      result.source.index,
      result.destination.index
    );

    this.setState({
      items
    }); */
  };

  const textToSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
  };

  const getItemStyle = (isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | undefined) => {
    if (isDragging) {
      return {
        userSelect: 'none',
        // border: '2px dashed green',
        padding: '8px !important',
        ...draggableStyle,
      };
    }
    return {};
  };

  const getListStyle = (isDraggingOver: boolean) => {
    if (isDraggingOver) {
      return {
        border: '2px dashed #ccc',
        padding: '8px !important',
      };
    }
    return {};
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

  const legendItems = sortedLayers.map((details, index) => {
    return (
      <Draggable
        isDragDisabled={!isDragEnabled}
        key={textToSlug(`${index}${details.layerPath}`)}
        draggableId={textToSlug(`${index}${details.layerPath}`)}
        index={details.order ?? index}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
          >
            <SingleLayer
              key={textToSlug(`layerKey-${index}-${details.layerPath}`)}
              depth={depth}
              layer={details}
              setIsLayersListPanelVisible={setIsLayersListPanelVisible}
            />
          </div>
        )}
      </Draggable>
    );
  });

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={textToSlug(`${parentLayerPath}_${depth}`)}>
        {(provided, snapshot) => (
          <Box sx={getListClass()} {...provided.droppableProps} ref={provided.innerRef} style={getListStyle(snapshot.isDraggingOver)}>
            {legendItems}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
}

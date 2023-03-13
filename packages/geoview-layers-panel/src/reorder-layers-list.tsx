/* eslint-disable react/require-default-props */
import { TypeWindow } from 'geoview-core';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';

interface Props {
  mapId: string;
  title: string;
  layerIds: string[];
  setReorderLayersVisible: (isVisible: boolean) => void;
  setMapLayers: (reorderedLayerIds: string[]) => void;
}

const w = window as TypeWindow;

/**
 * A react component that displays the reorderable layers list
 *
 * @returns {JSX.Element} A React JSX Element with the reorderable layers list
 */
function ReorderLayersList({ mapId, title, layerIds, setReorderLayersVisible, setMapLayers }: Props): JSX.Element {
  const { cgpv } = w;
  const { api, ui } = cgpv;

  const { List, ListItem, ListItemButton, ListItemIcon, HandleIcon, ListItemText, Box, IconButton, CloseIcon } = ui.elements;

  const { displayLanguage } = api.map(mapId!);

  const sxClasses = {
    titleBar: {
      position: 'relative',
      top: '-30px',
      zIndex: 1,
    },
    draggableList: {
      top: '-30px',
    },
    regularListItem: {
      color: 'text.primary',
      padding: 0,
    },
    draggingListItem: {
      color: 'text.primary',
      padding: 0,
      background: 'rgb(235,235,235,0.5)',
    },
    listItemText: {
      fontSize: 14,
      noWrap: true,
    },
    handleIcon: {
      margin: '8px 0px',
    },
  };

  const onDragEnd = ({ destination, source }: DropResult) => {
    if (!destination) return; // dropped outside the list
    const reorderedLayerIds = [...layerIds];
    const [removed] = reorderedLayerIds.splice(source.index, 1);
    reorderedLayerIds.splice(destination.index, 0, removed);
    api.map(mapId).moveLayer(removed, destination.index);
    setMapLayers(reorderedLayerIds);
  };

  const getLayerName = (layerId: string) => {
    return api.map(mapId).layer.geoviewLayers[layerId].geoviewLayerName[displayLanguage];
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'end', zIndex: 2 }}>
        <IconButton color="primary" onClick={() => setReorderLayersVisible(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={sxClasses.titleBar}>{title}</Box>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <List sx={sxClasses.draggableList} {...provided.droppableProps} innerref={provided.innerRef}>
              {layerIds.map((layerId, index) => (
                <Draggable key={layerId} draggableId={layerId} index={index}>
                  {(providedDrag, snapshotDrag) => (
                    <ListItem
                      innerref={providedDrag.innerRef}
                      sx={snapshotDrag.isDragging ? sxClasses.draggingListItem : sxClasses.regularListItem}
                      {...providedDrag.draggableProps}
                      {...providedDrag.dragHandleProps}
                    >
                      <ListItemButton>
                        <ListItemIcon>
                          <HandleIcon sx={sxClasses.handleIcon} />
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={sxClasses.listItemText} primary={getLayerName(layerId)} />
                      </ListItemButton>
                    </ListItem>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
}

export default ReorderLayersList;

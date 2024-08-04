/**
 * This component improves Mui's TreeView component to be able to process Layers data.
 */
import React, { useEffect, useState } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { logger } from '@/core/utils/logger';
import { EntryConfigBaseClass, GroupLayerEntryConfig } from '@/api/config/types/map-schema-types';

export interface AddLayerTreeProps {
  layersData: GroupLayerEntryConfig[];
  onSelectedItemsChange(items: string[]): void;
  startingSelectedItems: string[];
}

export function AddLayerTree(props: AddLayerTreeProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/add-layer-tree/add-layer-tree');

  const { layersData, startingSelectedItems } = props;
  const [defaultExpandedItems, setDefaultExpandedItems] = useState<string[]>([]); // e.g. ["layer1", "layer2"]
  const [defaultSelectedItems, setDefaultSelectedItems] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]); // e.g. ["group1/layer1", "group2/layer2"]

  // this use effect acts like onComponentDidMount
  useEffect(() => {
    setSelectedItems(startingSelectedItems);
    setDefaultSelectedItems(startingSelectedItems);

    const result = startingSelectedItems
      .map((item: string) => {
        return item.split('/');
      })
      .flat()
      .concat(selectedItems);
    setDefaultExpandedItems(result);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    props.onSelectedItemsChange(selectedItems);
  }, [selectedItems]);

  function renderTreeItem(layer: GroupLayerEntryConfig, parentId: string | null, parentIsSelected: boolean = false): JSX.Element {
    const curLayerId = `${parentId ? `${parentId}/` : ''}${layer.layerId}`;
    return (
      <TreeItem key={curLayerId} itemId={curLayerId} label={layer.layerName}>
        {layer?.listOfLayerEntryConfig?.length > 0 &&
          layer.listOfLayerEntryConfig.map((subLayer: EntryConfigBaseClass) =>
            renderTreeItem(subLayer as GroupLayerEntryConfig, curLayerId)
          )}
      </TreeItem>
    );
  }

  // Event handler for tree selection change
  function handleSelectedItemsChange(event: React.SyntheticEvent, items: string[] | string): void {
    const sortedItems = (items as string[]).sort();
    setSelectedItems(sortedItems);
  }

  if (!isInitialized) {
    return <></>;
  }

  return (
    <SimpleTreeView
      sx={{ fontSize: '0.8rem', '& .MuiTreeItem-label': { fontSize: '0.8rem !important' } }}
      multiSelect
      checkboxSelection
      defaultExpandedItems={defaultExpandedItems}
      defaultSelectedItems={defaultSelectedItems}
      onSelectedItemsChange={handleSelectedItemsChange}
    >
      {layersData[0].listOfLayerEntryConfig.map((layer) => renderTreeItem(layer as GroupLayerEntryConfig, null))}
    </SimpleTreeView>
  );
}

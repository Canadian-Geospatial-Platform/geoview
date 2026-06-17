/**
 * This component improves Mui's TreeView component to be able to process Layers data.
 */
import { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

import { logger } from '@/core/utils/logger';
import type { TypeGeoviewLayerConfig, TypeLayerEntryConfig } from '@/api/types/layer-schema-types';
import { UtilAddLayer } from '@/core/components/layers/left-panel/add-new-layer/add-layer-utils';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { Tooltip } from '@/ui/tooltip/tooltip';

export interface AddLayerTreeProps {
  layerTree: TypeGeoviewLayerConfig;
  onSelectedItemsChange(items: string[]): void;
}

/**
 * Creates the add-layer tree component.
 *
 * @param props - Properties defined in AddLayerTreeProps interface
 * @returns The add-layer tree component
 */
export function AddLayerTree(props: AddLayerTreeProps): JSX.Element | null {
  // Log
  logger.logTraceRender('components/layers/left-panel/add-layer-tree/add-layer-tree');

  const { layerTree, onSelectedItemsChange } = props;
  const { t } = useTranslation();
  const [selectedItems, setSelectedItems] = useState<string[]>([]); // e.g. ["group1/layer1", "group2/layer2"]

  /**
   * Propagates selected tree items to the parent component.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('ADD-LAYER-TREE - selectedItems', selectedItems);
    onSelectedItemsChange(selectedItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItems]);

  /**
   * Recursively renders a tree item with its nested children.
   *
   * @param layer - The layer to render
   * @param parentId - Optional parent layer id for path construction
   * @returns The rendered tree item component, or null if the layer is missing a required layerId
   */
  const renderTreeItem = (layer: TypeGeoviewLayerConfig | TypeLayerEntryConfig, parentId?: string): JSX.Element | null => {
    // Step 1: Extract layerId based on instance type
    let layerId: string | undefined;
    if (layer instanceof ConfigBaseClass) {
      ({ layerId } = layer);
    } else {
      layerId = layer.geoviewLayerId;
    }

    // Step 2: Validate layerId early - return null if missing
    if (!layerId) {
      logger.logError('add-layer-tree', 'Layer missing required ID, skipping render', layer);
      return null;
    }

    // Step 3: Compute layerName only after layerId is validated
    let layerName: string;
    if (layer instanceof ConfigBaseClass) {
      layerName = layer.getLayerNameCascade(); // Use cascade - always returns non-empty string
    } else {
      // Fallback chain for non-ConfigBaseClass with translation
      layerName = layer.geoviewLayerName?.trim() || layerId || t('layers.unknownLayer');
    }

    // Step 4: Continue with rendering
    const curLayerId = `${parentId ? `${parentId}/` : ''}${layerId}`;

    return (
      <Tooltip key={curLayerId} title={layerName} placement="top">
        <TreeItem itemId={curLayerId} label={layerName} aria-label={layerName}>
          {layer.listOfLayerEntryConfig
            ?.map((subLayer) => renderTreeItem(subLayer, curLayerId))
            .filter((item): item is JSX.Element => item !== null)}
        </TreeItem>
      </Tooltip>
    );
  };

  /**
   * Get all children of a layer
   * @param treeLayerId - the id of the layer
   * @returns - the list of children of the layer
   */
  const getLayerChildren = (treeLayerId: string): string[] => {
    const result: string[] = [];

    function populateLayerChildren(origLayerId: string, parentViewId: string | undefined): void {
      const viewLayerId = `${parentViewId ?? ''}${parentViewId ? '/' : ''}${origLayerId}`;
      result.push(viewLayerId);
      const layerDetails = UtilAddLayer.findLayerById(layerTree, origLayerId);

      const childLayerIds: string[] | undefined = layerDetails?.listOfLayerEntryConfig?.map((child) => {
        return child.layerId;
      });

      childLayerIds?.forEach((childLayerId) => {
        populateLayerChildren(childLayerId, viewLayerId);
      });
    }

    const layerTokens = treeLayerId.split('/');
    const origLayerId = layerTokens.pop();
    let parentLayerId;
    if (layerTokens.length > 0) {
      parentLayerId = layerTokens.join('/');
    }
    if (origLayerId) populateLayerChildren(origLayerId, parentLayerId);

    return [...new Set(result)].sort();
  };

  const handleItemSelectionToggle = (event: React.SyntheticEvent, itemId: string, isSelected: boolean): void => {
    const layerChildren = getLayerChildren(itemId);
    const toAddOrRemove = [itemId, ...layerChildren];
    const splitId = itemId.split('/');
    splitId.pop();
    const parentId = splitId.join('/');

    if (isSelected) {
      setSelectedItems([...new Set([...selectedItems, ...toAddOrRemove])].sort());
    } else if (parentId && !selectedItems.find((selectedItem) => selectedItem.startsWith(`${parentId}/`) && selectedItem !== itemId))
      setSelectedItems(selectedItems.filter((item) => item !== parentId && item !== itemId));
    else setSelectedItems(selectedItems.filter((item) => !toAddOrRemove.includes(item)));
  };

  const renderTreeItems = (): JSX.Element[] => {
    // If the layer tree is a TypeGeoviewLayerConfig of type EsriDynamic or WFS
    if (
      layerTree.geoviewLayerType === 'esriDynamic' ||
      layerTree.geoviewLayerType === 'ogcWfs' ||
      layerTree.geoviewLayerType === 'ogcWms' ||
      layerTree.geoviewLayerType === 'ogcFeature'
    ) {
      return layerTree.listOfLayerEntryConfig.map((layer) => renderTreeItem(layer)).filter((item): item is JSX.Element => item !== null);
    }
    return [renderTreeItem(layerTree)].filter((item): item is JSX.Element => item !== null);
  };

  return (
    <SimpleTreeView
      sx={{
        fontSize: '0.8rem',
        '& .MuiTreeItem-label': {
          fontSize: '0.8rem !important',
          paddingTop: '3px',
          paddingBottom: '3px',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
        },
      }}
      multiSelect
      checkboxSelection
      selectedItems={selectedItems}
      onItemSelectionToggle={handleItemSelectionToggle}
    >
      {renderTreeItems()}
    </SimpleTreeView>
  );
}

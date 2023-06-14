/* eslint-disable react/require-default-props */
import { TypeWindow, getLocalizedValue, TypeTabs, AbstractGeoViewVector, TypeListOfLayerEntryConfig } from 'geoview-core';
import GroupLayers from './group-layers';

interface Props {
  mapId: string;
}
const w = window as TypeWindow;

/**
 * Create an element that displays the data grid footer component
 *
 * @returns {JSX.Element} created data grid footer component
 */
export function DataItem({ mapId }: Props): JSX.Element {
  const { cgpv } = w;
  const { api, ui, react } = cgpv;
  const { Tabs } = ui.elements;
  const {
    utilities: { isVectorLayer },
  } = api;
  const { useState, useEffect } = react;

  // eslint-disable-next-line @typescript-eslint/ban-types
  const [dataLayers, setDataLayers] = useState<string[]>([]);

  useEffect(() => {
    setDataLayers(Object.keys(api.map(mapId!).layer.geoviewLayers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, mapId]);

  setTimeout(() => {
    dataLayers.forEach((layerId) => {
      const layerSelection = document.getElementById(`${layerId}-groupLayerSelection`);
      if (layerSelection) {
        (layerSelection as HTMLSelectElement).addEventListener('change', function onChange(this) {
          const { selectedIndex } = this;
          const datagridTables = document.getElementsByClassName(`${layerId}-layer-datagrid-table`);
          if (datagridTables.length > 0) {
            for (let i = 0; i < datagridTables.length; i++) {
              (datagridTables[i] as HTMLDivElement).setAttribute('style', `display:${i !== selectedIndex ? 'none' : 'block'}`);
            }
          }
        });
      }
    });
  }, 2000);

  /**
   * Extract layers keys from layer entry config of geoviewinstance
   * @param geoviewLayerInstance layer instance which hold all properties of layer rendered on map.
   * @param layerId id of the layer rendered on the map.
   * @returns array of layer keys.
   */
  const getLayerKeys = (geoviewLayerInstance: AbstractGeoViewVector, layerId: string): string[] => {
    const groupLayerKeys: string[] = [];
    if (
      geoviewLayerInstance.listOfLayerEntryConfig.length > 0 &&
      (geoviewLayerInstance as AbstractGeoViewVector).getAllFeatureInfo !== undefined
    ) {
      const getGroupKeys = (listOfLayerEntryConfig: TypeListOfLayerEntryConfig, parentLayerId: string) => {
        listOfLayerEntryConfig.forEach((LayerEntryConfig) => {
          if (
            LayerEntryConfig.entryType === 'group' &&
            LayerEntryConfig.listOfLayerEntryConfig !== undefined &&
            LayerEntryConfig.listOfLayerEntryConfig.length > 1
          ) {
            getGroupKeys(LayerEntryConfig.listOfLayerEntryConfig, `${parentLayerId}/${LayerEntryConfig.layerId}`);
          } else if (LayerEntryConfig.entryType !== 'group') {
            groupLayerKeys.push(`${parentLayerId}/${LayerEntryConfig.layerId}`);
          }
        });
      };
      getGroupKeys(geoviewLayerInstance.listOfLayerEntryConfig, layerId);
    }
    return isVectorLayer(geoviewLayerInstance) ? groupLayerKeys : [];
  };

  return (
    <Tabs
      tabsProps={{
        variant: 'scrollable',
      }}
      tabs={dataLayers.map((layerId, index): TypeTabs => {
        const geoviewLayerInstance = api.map(mapId).layer.geoviewLayers[layerId] as AbstractGeoViewVector;
        const labelValue = getLocalizedValue(geoviewLayerInstance.geoviewLayerName, mapId);
        const layerKeys = getLayerKeys(geoviewLayerInstance, layerId);

        return {
          value: index,
          label: labelValue !== undefined ? labelValue : `data-${index}`,
          content: () => {
            return api.map(mapId).dataGrid.createDataGrid({
              layerId,
              ...(layerKeys.length > 1 && { groupLayers: <GroupLayers layerKeys={layerKeys} layerId={layerId} mapId={mapId} /> }),
            });
          },
        };
      })}
    />
  );
}

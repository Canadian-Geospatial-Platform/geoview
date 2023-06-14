interface GroupLayersProps {
  layerKeys: string[];
  layerId: string;
  mapId: string;
}

/**
 * Create a select element with layers as options.
 * @param layerKeys list of layer keys
 * @param layerId id of the layer
 * @param mapId id of the map
 * @returns {JSX.Element} created data grid footer component
 */

export default function GroupLayers({ mapId, layerKeys, layerId }: GroupLayersProps) {
  return (
    <select id={`${layerId}-groupLayerSelection`} style={{ fontSize: '1em', margin: '1em', padding: '0.3em' }}>
      {layerKeys.map((layerKey) => {
        return (
          <option key={`${mapId}-${layerKey}-${layerId}`} value={layerKey}>
            {layerKey}
          </option>
        );
      })}
    </select>
  );
}

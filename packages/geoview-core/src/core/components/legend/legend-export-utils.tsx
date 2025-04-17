// Utility function to build a hierarchical legend DOM structure from TypeLegendLayer[]
// Usage: const legendElement = buildLegendContainer(layers);
//        legendContainerRef.current.appendChild(legendElement);

import { TypeLegendLayer } from '../layers/types';

/**
 * Builds a hierarchical legend DOM structure from an array of TypeLegendLayer (ContainerLayers).
 * @param layers Array of TypeLegendLayer (ContainerLayers)
 * @returns HTMLElement representing the legend hierarchy
 */
export function buildLegendContainer(layers: TypeLegendLayer[]): HTMLElement {
  // Helper to create icon image element
  function createIcon(imgUrl: string | null | undefined, alt: string): HTMLElement {
    const img = document.createElement('img');
    img.src = imgUrl || '';
    img.alt = alt;
    img.style.maxWidth = '1.5em';
    img.style.verticalAlign = 'middle';
    return img;
  }

  // Recursive helper
  function buildLayer(layer: TypeLegendLayer): HTMLElement {
    const layerDiv = document.createElement('div');

    if (layer.controls?.visibility === false) {
      return layerDiv; // Skip this layer if visibility is false
    }

    layerDiv.style.marginLeft = '0.5em';
    layerDiv.style.marginBottom = '0.5em';
    layerDiv.style.padding = '0.25em';
    layerDiv.style.textAlign = 'left';

    // Top icon and name
    if (layer.icons?.[0]?.iconImage) {
      layerDiv.appendChild(createIcon(layer.icons[0].iconImage, layer.layerName));
    }
    const nameSpan = document.createElement('span');
    nameSpan.textContent = ` ${layer.layerName}`;
    nameSpan.style.fontWeight = 'bold';
    layerDiv.appendChild(nameSpan);

    // layer.Children.
    if (layer.children && layer.children.length) {
      const childrenDiv = document.createElement('div');
      childrenDiv.style.marginLeft = '2em';
      layer.children.forEach((child) => {
        childrenDiv.appendChild(buildLayer(child));
      });
      layerDiv.appendChild(childrenDiv);
    }

    // layer.items.
    if (layer.items && layer.items.length) {
      const itemsDiv = document.createElement('div');

      itemsDiv.style.marginLeft = 'auto';
      itemsDiv.style.marginRight = '0';

      layer.items.forEach((item) => {
        const itemDiv = document.createElement('div');
        if (item?.isVisible === false) {
          return; // Skip this layer if visibility is false
        }

        itemDiv.style.textAlign = 'left';
        itemDiv.style.marginLeft = '2em';
        if (item.icon) {
          itemDiv.appendChild(createIcon(item.icon, item.name));
        }
        const itemName = document.createElement('span');
        itemName.textContent = ` ${item.name}`;
        itemDiv.appendChild(itemName);
        itemsDiv.appendChild(itemDiv);
      });
      layerDiv.appendChild(itemsDiv);
    }

    return layerDiv;
  }

  // Main container
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'row';
  container.style.flexWrap = 'wrap';
  container.style.gap = '1em';
  container.style.overflow = 'auto';
  container.style.marginLeft = 'auto';
  container.style.marginRight = '0';

  layers.forEach((layer) => {
    container.appendChild(buildLayer(layer));
  });
  return container;
}

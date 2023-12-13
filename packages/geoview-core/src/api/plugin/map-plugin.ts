import { createRoot } from 'react-dom/client';
import { AbstractPlugin } from './abstract-plugin';

/** ******************************************************************************************************************************
 * Map Plugin abstract class.
 */
export abstract class MapPlugin extends AbstractPlugin {
  /**
   * Overridable function to create map plugin actual content
   * @returns JSX.Element The map plugin actual content
   */
  onCreateContent(): JSX.Element {
    // Override this to create panel..

    // Return dummy content
    return this.react!.createElement(
      'div',
      undefined,
      `<div>Content for Map Plugin on map id ${this.pluginProps.mapId} goes here...</div>`
    );
  }

  /**
   * Called when a map plugin is being added
   */
  onAdd(): void {
    // If some layers set
    if ((this.configObj?.layers as string[]).length > 0) {
      // create the swiper container and insert it after top link
      const el = document.createElement('div');
      el.setAttribute('id', `${this.pluginProps.mapId}-${this.pluginId}`);
      const mapElement = document.getElementById(`map-${this.pluginProps.mapId}`);
      mapElement?.insertBefore(el, mapElement.firstChild);

      // create the swiper component and render
      const node = this.onCreateContent();
      const root = createRoot(document.getElementById(`${this.pluginProps.mapId}-${this.pluginId}`)!);
      root.render(node);
    }
  }

  /**
   * Called when a map plugin is being removed
   */
  onRemove(): void {
    // If cgpv exists
    if (this.api) {
      // TODO: Enable swiper removal, make it work with React 18+ new root and unmount
      // cgpv.reactDOM.unmountComponentAtNode(document.getElementById(`${mapId}-swiper`)! as Element);
    }
  }
}

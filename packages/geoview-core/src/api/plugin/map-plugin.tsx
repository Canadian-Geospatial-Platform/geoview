import type { Root } from 'react-dom/client';
import { MapContext } from '@/core/app-start';
import { AbstractPlugin } from './abstract-plugin';

/**
 * Map Plugin abstract class.
 */
export abstract class MapPlugin extends AbstractPlugin {
  /** The root for the mounted Map Plugin */
  reactRoot?: Root;

  /**
   * Overridable function to create map plugin actual content
   * @returns {JSX.Element} The map plugin actual content
   * @protected
   */
  protected onCreateContent(): JSX.Element {
    // Override this to create panel..

    // Return dummy content
    return this.react.createElement('div', undefined, `<div>Content for Map Plugin on map id ${this.mapViewer.mapId} goes here...</div>`);
  }

  /**
   * Called when a map plugin is being added
   * @returns {void}
   * @protected
   */
  protected onAdd(): void {
    // create the swiper container and insert it after top link
    const el = document.createElement('div');
    el.setAttribute('id', `${this.mapViewer.mapId}-${this.pluginId}`);
    const mapElement = document.getElementById(`mapTargetElement-${this.mapViewer.mapId}`);
    mapElement?.prepend(el);

    // create the swiper component and render
    const node = this.onCreateContent();
    this.reactRoot = this.createRoot(el);
    this.reactRoot.render(<MapContext.Provider value={{ mapId: this.mapViewer.mapId }}>{node}</MapContext.Provider>);
  }

  /**
   * Called when a map plugin is being removed
   * @returns {void}
   * @protected
   */
  protected onRemove(): void {
    // Unmount the Map Plugin
    this.reactRoot?.unmount();
    this.reactRoot = undefined;
  }
}

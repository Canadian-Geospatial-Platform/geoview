import type { TypeTabs } from '@/ui/tabs/tabs';
import { logger } from '@/core/utils/logger';
import { AbstractPlugin } from './abstract-plugin';

/**
 * Footer Plugin abstract class.
 */
export abstract class FooterPlugin extends AbstractPlugin {
  // Store index of tab
  value?: number;

  // Store the footer props
  footerProps?: TypeTabs;

  /**
   * Overrides the get config
   * @returns {unknown} The config
   * @override
   */
  override getConfig(): unknown {
    return super.getConfig();
  }

  /**
   * Overridable function to create footer props content
   * @returns {TypeTabs} The footer props content
   * @protected
   */
  protected onCreateContentProps(): TypeTabs {
    // Override this to create the footer props..

    // Return dummy content
    return {
      id: 'some-id',
      value: this.value!,
      label: 'Some label',
      content: `<div>Content for Footer plugin on map id ${this.mapViewer.mapId} goes here...</div>`,
    };
  }

  /**
   * Called when a footer plugin is being added
   * @returns {void}
   * @protected
   */
  protected onAdd(): void {
    // Log
    // No need to log, parent class does it well already via added() function.

    // Set value to length of tabs(?)
    this.value = this.mapViewer.footerBarApi.tabs.length;

    // Create props
    this.footerProps = this.onCreateContentProps();

    // Create tab with the props
    this.mapViewer.footerBarApi.createTab(this.footerProps);
  }

  /**
   * Called when a footer plugin is being removed
   * @returns {void}
   * @protected
   */
  protected onRemove(): void {
    // Log
    // No need to log, parent class does it well already via remove() function.

    // Remove the footer tab
    if (this.value && this.mapViewer?.footerBarApi) this.mapViewer.footerBarApi.removeTab(this.footerProps!.id);
  }

  /**
   * Selects the Plugin.
   * @returns {void}
   */
  select(): void {
    // Redirect
    this.onSelect();
  }

  /**
   * Overridable function called when the Plugin is being selected.
   * @returns {void}
   * @protected
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onSelect(): void {
    // Log
    logger.logTraceCore('FOOTER-PLUGIN - onSelected');

    // TODO: Refactor - Move 'onSelect' in AbstractPlugin class so that AppBar can eventually benefit as well?

    // Nothing else here.. but inherited FooterPlugins might override this method to do stuff when they are selected!
  }
}

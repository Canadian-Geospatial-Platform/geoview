import type { TypeTabs } from '@/ui/tabs/tabs';
import { AbstractPlugin } from './abstract-plugin';
import { getStoreUIFooterTabs } from '@/core/stores/states/ui-state';

/**
 * Footer Plugin abstract class.
 */
export abstract class FooterPlugin extends AbstractPlugin {
  /** The index of the tab */
  value?: number;

  /** The footer props */
  footerProps?: TypeTabs;

  /**
   * Overrides the get config.
   *
   * @returns The config
   */
  override getConfig(): unknown {
    return super.getConfig();
  }

  /**
   * Overridable function to create footer props content.
   *
   * @returns The footer props content
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
   */
  protected onAdd(): void {
    // Set value to length of tabs from the store
    this.value = getStoreUIFooterTabs(this.mapViewer.mapId).length;

    // Create props
    this.footerProps = this.onCreateContentProps();

    // Create tab with the props
    this.mapViewer.footerBarApi.createTab(this.footerProps);
  }

  /**
   * Called when a footer plugin is being removed
   */
  protected onRemove(): void {
    // Remove the footer tab
    if (this.value && this.mapViewer?.footerBarApi) this.mapViewer.footerBarApi.removeTab(this.footerProps!.id);
  }
}

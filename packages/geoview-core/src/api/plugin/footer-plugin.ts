import { TypeTabs } from '@/ui/tabs/tabs';
import { AbstractPlugin } from './abstract-plugin';

/** ******************************************************************************************************************************
 * Footer Plugin abstract class.
 */
export abstract class FooterPlugin extends AbstractPlugin {
  // Store index of tab
  value?: number;

  // Store the footer props
  footerProps?: TypeTabs;

  /**
   * Overridable function to create footer props content
   * @returns TypeTabs The footer props content
   */
  onCreateContentProps(): TypeTabs {
    // Override this to create the footer props..

    // Return dummy content
    return {
      id: 'some-id',
      value: this.value!,
      label: 'Some label',
      content: `<div>Content for Footer plugin on map id ${this.pluginProps.mapId} goes here...</div>`,
    };
  }

  /**
   * Called when a footer plugin is being added
   */
  onAdd(): void {
    // Set value to length of tabs(?)
    this.value = this.map()?.footerTabs.tabs.length;

    // Create props
    this.footerProps = this.onCreateContentProps();

    // Create tab with the props
    this.map()?.footerTabs.createFooterTab(this.footerProps);
  }

  /**
   * Called when a footer plugin is being removed
   */
  onRemove(): void {
    // Remove the footer tab
    if (this.value) this.map()?.footerTabs.removeFooterTab(this.footerProps!.id);
  }
}
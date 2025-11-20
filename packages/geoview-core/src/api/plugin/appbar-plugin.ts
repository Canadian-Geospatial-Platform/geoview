import type { TypeWindow } from '@/core/types/global-types';
import type { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { AbstractPlugin } from './abstract-plugin';

/**
 * AppBar Plugin abstract class.
 */
export abstract class AppBarPlugin extends AbstractPlugin {
  // Store the created button panel object
  buttonPanel?: TypeButtonPanel;

  // Store the button props
  buttonProps?: IconButtonPropsExtend;

  // Store the panel props
  panelProps?: TypePanelProps;

  /**
   * Overrides the get config
   * @override
   * @returns {AppBarPluginConfig} The config
   */
  override getConfig(): AppBarPluginConfig {
    return super.getConfig() as AppBarPluginConfig;
  }

  /**
   * Overridable function to create app bar button props content
   * @returns IconButtonPropsExtend The app bar button props content
   */
  protected onCreateButtonProps(): IconButtonPropsExtend {
    // Override this to create the button props..

    // Get cgpv
    const { cgpv } = window as TypeWindow;
    const { MapIcon } = cgpv.ui.elements;

    // Return dummy plugin button
    return {
      id: 'somePluginButton',
      'aria-label': 'Some aria label',
      tooltip: 'Some tooltip',
      tooltipPlacement: 'right',
      children: this.react.createElement(MapIcon),
      visible: true,
    };
  }

  /**
   * Overridable function to create app bar props content
   * @returns TypePanelProps The app bar props content
   */
  protected onCreateContentProps(): TypePanelProps {
    // Override this to create the panel props..

    // Panel props
    return {
      title: 'Some title',
      icon: '<i class="material-icons">map</i>',
      width: '80vw',
      status: this.getConfig().isOpen,
    };
  }

  /**
   * Overridable function to create app bar actual content
   * @returns JSX.Element The app bar actual content
   */
  protected onCreateContent(): JSX.Element {
    // Override this to create panel..

    // Return dummy content
    return this.react.createElement('div', undefined, `Content for AppBar Plugin on map id ${this.mapViewer.mapId} goes here...`);
  }

  /**
   * Called when an app bar plugin is being added
   */
  protected onAdd(): void {
    // Create button props
    this.buttonProps = this.onCreateButtonProps();

    // Create panel props
    this.panelProps = this.onCreateContentProps();

    // Create content
    this.panelProps.content = this.onCreateContent();

    // Create a new button panel on the app-bar
    this.buttonPanel = this.mapViewer.appBarApi.createAppbarPanel(this.buttonProps, this.panelProps) || undefined;
  }

  /**
   * Called when an app bar plugin is being removed
   */
  protected onRemove(): void {
    // If cgpv exists
    if (this.buttonPanel) {
      // Remove the app bar panel
      this.mapViewer.appBarApi.removeAppbarPanel(this.buttonPanel.buttonPanelId);
    }
  }
}

export type AppBarPluginConfig = {
  isOpen: boolean;
};

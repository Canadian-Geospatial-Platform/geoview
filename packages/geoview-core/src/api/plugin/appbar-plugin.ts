import { TypeWindow, TypeButtonPanel, TypeIconButtonProps, TypePanelProps } from '@/core/types/cgpv-types';
import { AbstractPlugin } from './abstract-plugin';

/** ******************************************************************************************************************************
 * AppBar Plugin abstract class.
 */
export abstract class AppBarPlugin extends AbstractPlugin {
  // Store the created button panel object
  buttonPanel?: TypeButtonPanel;

  /**
   * Overridable function to create app bar button props content
   * @returns TypeIconButtonProps The app bar button props content
   */
  onCreateButtonProps(): TypeIconButtonProps {
    // Override this to create the button props..

    // Fetch cgpv
    const { cgpv } = window as TypeWindow;
    const { MapIcon } = cgpv.ui.elements;

    // Return dummy plugin button
    return {
      id: 'somePluginButton',
      tooltip: 'Some tooltip',
      tooltipPlacement: 'right',
      children: this.react!.createElement(MapIcon),
      visible: true,
    };
  }

  /**
   * Overridable function to create app bar props content
   * @returns TypePanelProps The app bar props content
   */
  onCreateContentProps(): TypePanelProps {
    // Override this to create the panel props..

    // Panel props
    return {
      title: 'Some title',
      icon: '<i class="material-icons">map</i>',
      width: '80vw',
      status: this.configObj?.isOpen as boolean,
    };
  }

  /**
   * Overridable function to create app bar actual content
   * @returns JSX.Element The app bar actual content
   */
  onCreateContent(): JSX.Element {
    // Override this to create panel..

    // Return dummy content
    return this.react!.createElement('div', undefined, `Content for AppBar Plugin on map id ${this.pluginProps.mapId} goes here...`);
  }

  /**
   * Called when an app bar plugin is being added
   */
  onAdd(): void {
    // Create button props
    const buttonProps = this.onCreateButtonProps();

    // Create panel props
    const panelProps = this.onCreateContentProps();

    // Create a new button panel on the app-bar
    this.buttonPanel = this.map()?.appBarButtons.createAppbarPanel(buttonProps!, panelProps, null) || undefined;

    // Create content
    const content = this.onCreateContent();

    // Set panel content
    this.buttonPanel?.panel?.changeContent(content);
  }

  /**
   * Called when an app bar plugin is being removed
   */
  onRemove(): void {
    // If cgpv exists
    if (this.api && this.buttonPanel) {
      // Remove the app bar panel
      this.map()?.appBarButtons.removeAppbarPanel(this.buttonPanel.buttonPanelId);
    }
  }
}

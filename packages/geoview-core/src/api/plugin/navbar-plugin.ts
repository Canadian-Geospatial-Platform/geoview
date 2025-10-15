import { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import { AbstractPlugin } from './abstract-plugin';
import { TypeWindow } from '@/core/types/global-types';
import { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { logger } from '@/core/utils/logger';

export type TypeNavBarButtonConfig = {
  buttonProps: IconButtonPropsExtend;
  panelProps?: TypePanelProps;
  groupName: string;
  groupConfig?: { accordionThreshold?: number };
};

/**
 * NavBar Plugin abstract class.
 */
export abstract class NavBarPlugin extends AbstractPlugin {
  // The buttons with or without panels, to be rendered in the NavBar
  buttonPanels: Record<string, TypeButtonPanel> = {};

  /**
   * Overridable function to create nav bar button props content
   * @returns IconButtonPropsExtend The nav bar button props content
   */
  protected onCreateButtonConfigs(): Record<string, TypeNavBarButtonConfig> {
    logger.logInfo('NavBar Plugin - Default onCreateButtonProps');
    // Override this to create the button props..
    // Get cgpv
    const { cgpv } = window as TypeWindow;
    const { MapIcon } = cgpv.ui.elements;

    // Return dummy plugin button
    return {
      main: {
        buttonProps: {
          id: 'someNavBarPluginButton',
          tooltip: 'Some tooltip',
          tooltipPlacement: 'right',
          children: this.react.createElement(MapIcon),
          visible: true,
        },
        panelProps: {
          title: 'Some Title',
          icon: '<i class="material-icons">map</i>',
          width: 300,
          status: false,
        },
        groupName: 'default',
      },
    };
  }

  /**
   * Called when a nav bar plugin is being added
   */
  protected onAdd(): void {
    // Create button props
    logger.logInfo('NavBar Plugin - Default onAdd');
    const buttonConfigs = this.onCreateButtonConfigs();

    // Set group configurations first
    const processedGroups = new Set<string>();
    Object.values(buttonConfigs).forEach((config) => {
      if (config.groupConfig && !processedGroups.has(config.groupName)) {
        this.mapViewer.navBarApi.setGroupConfig(config.groupName, config.groupConfig);
        processedGroups.add(config.groupName);
      }
    });

    // Create buttons and panels based on configs
    Object.entries(buttonConfigs).forEach(([key, config]) => {
      let buttonPanel: TypeButtonPanel | undefined;

      if (config.panelProps) {
        // Create a button with panel
        buttonPanel =
          this.mapViewer.navBarApi.createNavbarButtonPanel(config.buttonProps, config.panelProps, config.groupName) || undefined;
      } else {
        // Create a simple button
        buttonPanel = this.mapViewer.navBarApi.createNavbarButton(config.buttonProps, config.groupName) || undefined;
      }

      if (buttonPanel) this.buttonPanels[key] = buttonPanel;
    });
  }

  /**
   * Called when a nav bar plugin is being removed
   */
  protected onRemove(): void {
    // Remove the button or button panel from the navbar
    if (Object.keys(this.buttonPanels).length > 0 && this.mapViewer?.navBarApi) {
      Object.values(this.buttonPanels).forEach((buttonPanel: TypeButtonPanel) => {
        this.mapViewer.navBarApi.removeNavbarButtonPanel(buttonPanel.buttonPanelId);
      });
    }
  }
}

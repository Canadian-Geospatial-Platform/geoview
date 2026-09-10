import type { TypeNavBarButtonConfig } from 'geoview-core/api/plugin/navbar-plugin';
import type { TypeDrawerConfig } from 'geoview-core/core/stores/states/drawer-state';
import type { TypeWindow } from 'geoview-core/core/types/global-types';

import { logger } from 'geoview-core/core/utils/logger';

import Draw from './buttons/draw';
import { GeometryPickerButton, GeometryPickerPanel } from './buttons/geometry-picker';
import Edit from './buttons/edit';
import { StyleButton, StylePanel } from './buttons/style';
import Snapping from './buttons/snap';
import Measurements from './buttons/measurements';
import Undo from './buttons/undo';
import Redo from './buttons/redo';
import Download from './buttons/download';
import Upload from './buttons/upload';
import Clear from './buttons/clear';
import Shortcuts from './buttons/shortcuts';

/**
 * Creates all drawer button configurations for the NavBar.
 *
 * @param mapId - The map identifier, used to keep button ids unique across map instances
 * @param config - The drawer configuration
 * @returns The button configurations for the drawer bar
 */
export function createDrawerButtons(mapId: string, config: TypeDrawerConfig): Record<string, TypeNavBarButtonConfig> {
  const { cgpv } = window as TypeWindow;
  const { createElement } = cgpv.reactUtilities.react;

  const geomTypes = config?.geomTypes || ['Point', 'LineString', 'Polygon', 'Circle'];
  const { CloseIcon } = cgpv.ui.elements;
  const buttonConfigs: Record<string, TypeNavBarButtonConfig> = {};

  logger.logInfo('Drawer Plugin - Creating draw buttons ...');
  // Create draw button
  buttonConfigs.draw = {
    buttonProps: {
      'aria-label': 'drawer.toggleDrawing',
      tooltipPlacement: 'left',
      children: createElement(Draw),
      visible: true,
    },
    groupName: 'drawer',
    // Only need to set the accordionThreshold once and the first in the list will take priority
    groupConfig: { accordionThreshold: 5 },
  };

  // Create geometry picker button / panel
  buttonConfigs.geometryPicker = {
    buttonProps: {
      'aria-label': 'drawer.geometryPickerPanel',
      tooltipPlacement: 'left',
      children: createElement(GeometryPickerButton),
      visible: true,
    },
    groupName: 'drawer',
    panelProps: {
      title: 'drawer.geometryPicker',
      icon: createElement(CloseIcon),
      content: createElement(GeometryPickerPanel, { geomTypes }),
      status: false,
    },
  };

  // Create style button
  buttonConfigs.style = {
    buttonProps: {
      id: `${mapId}-drawer-style`, // Looked up via querySelector in drawer-controller.ts openStyleMenu()
      'aria-label': 'drawer.style',
      tooltipPlacement: 'left',
      children: createElement(StyleButton),
      visible: true,
    },
    groupName: 'drawer',
    panelProps: {
      title: 'drawer.style',
      icon: createElement(CloseIcon),
      content: createElement(StylePanel),
      width: 'auto',
      status: false,
    },
  };

  // Create edit button
  buttonConfigs.edit = {
    buttonProps: {
      'aria-label': 'drawer.edit',
      tooltipPlacement: 'left',
      children: createElement(Edit),
      visible: true,
    },
    groupName: 'drawer',
  };

  // Create shortcuts button
  buttonConfigs.shortcuts = {
    buttonProps: {
      'aria-label': 'drawer.shortcutsTooltip',
      tooltipPlacement: 'left',
      children: createElement(Shortcuts),
      visible: true,
    },
    groupName: 'drawer',
  };

  // Create snapping button
  buttonConfigs.snap = {
    buttonProps: {
      'aria-label': 'drawer.toggleSnapping',
      tooltipPlacement: 'left',
      children: createElement(Snapping),
      visible: true,
    },
    groupName: 'drawer',
  };

  // Create show measure button
  buttonConfigs.measure = {
    buttonProps: {
      'aria-label': 'drawer.toggleMeasurements',
      tooltipPlacement: 'left',
      children: createElement(Measurements),
      visible: true,
    },
    groupName: 'drawer',
  };

  // Create undo button
  buttonConfigs.undo = {
    buttonProps: {
      'aria-label': 'drawer.undoTooltip',
      tooltipPlacement: 'left',
      children: createElement(Undo),
      visible: true,
    },
    groupName: 'drawer',
  };

  // Create redo button
  buttonConfigs.redo = {
    buttonProps: {
      'aria-label': 'drawer.redoTooltip',
      tooltipPlacement: 'left',
      children: createElement(Redo),
      visible: true,
    },
    groupName: 'drawer',
  };

  // Create download button
  buttonConfigs.download = {
    buttonProps: {
      'aria-label': 'drawer.downloadTooltip',
      tooltipPlacement: 'left',
      children: createElement(Download),
      visible: true,
    },
    groupName: 'drawer',
  };

  // Create upload button
  buttonConfigs.upload = {
    buttonProps: {
      'aria-label': 'drawer.uploadTooltip',
      tooltipPlacement: 'left',
      children: createElement(Upload),
      visible: true,
    },
    groupName: 'drawer',
  };

  // Create clear button
  buttonConfigs.clear = {
    buttonProps: {
      'aria-label': 'drawer.clearTooltip',
      tooltipPlacement: 'left',
      children: createElement(Clear),
      visible: true,
    },
    groupName: 'drawer',
  };

  return buttonConfigs;
}

import { TypeNavBarButtonConfig } from 'geoview-core/api/plugin/navbar-plugin';
import { TypeDrawerConfig } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';
import { TypeWindow } from 'geoview-core/core/types/global-types';

import { logger } from 'geoview-core/core/utils/logger';

import Draw from './buttons/draw';
import { GeometryPickerButton, GeometryPickerPanel } from './buttons/geometry-picker';
import Edit from './buttons/edit';
import { StyleButton, StylePanel } from './buttons/style';
import Measurements from './buttons/measurements';
import Undo from './buttons/undo';
import Redo from './buttons/redo';
import Download from './buttons/download';
import Upload from './buttons/upload';
import Clear from './buttons/clear';

export function createDrawerButtons(config: TypeDrawerConfig): Record<string, TypeNavBarButtonConfig> {
  const { cgpv } = window as TypeWindow;
  const { createElement } = cgpv.reactUtilities.react;

  const geomTypes = config?.geomTypes || ['Point', 'LineString', 'Polygon', 'Circle'];
  const { CloseIcon } = cgpv.ui.elements;
  const buttonConfigs: Record<string, TypeNavBarButtonConfig> = {};

  logger.logInfo('Drawer Plugin - Creating draw buttons ...');
  // Create draw button
  buttonConfigs.draw = {
    buttonProps: {
      id: 'drawer-draw',
      children: createElement(Draw),
      visible: true,
    },
    groupName: 'drawer',
    // Only need to set the accordionThreshold once and the first in the list will take priority
    groupConfig: { accordionThreshold: 4 },
  };

  // Create geometry picker button / panel
  buttonConfigs.geometryPicker = {
    buttonProps: {
      id: 'drawer-geometry-picker',
      tooltip: 'drawer.geometryPicker',
      tooltipPlacement: 'left',
      children: createElement(GeometryPickerButton),
      visible: true,
    },
    groupName: 'drawer',
    panelProps: {
      title: 'drawer.geometryPicker',
      icon: createElement(CloseIcon),
      content: createElement(GeometryPickerPanel, { geomTypes }),
      width: 'flex',
      status: false,
    },
  };

  // Create style button
  buttonConfigs.style = {
    buttonProps: {
      id: 'drawer-style',
      tooltip: 'drawer.style',
      tooltipPlacement: 'left',
      children: createElement(StyleButton),
      visible: true,
    },
    groupName: 'drawer',
    panelProps: {
      title: 'drawer.style',
      icon: createElement(CloseIcon),
      content: createElement(StylePanel),
      width: 'flex',
      status: false,
    },
  };

  // Create edit button
  buttonConfigs.edit = {
    buttonProps: {
      id: 'drawer-edit',
      children: createElement(Edit),
      visible: true,
    },
    groupName: 'drawer',
  };

  // Create show measure button
  buttonConfigs.measure = {
    buttonProps: {
      id: 'drawer-measure',
      children: createElement(Measurements),
      visible: true,
    },
    groupName: 'drawer',
  };

  // Create undo button
  buttonConfigs.undo = {
    buttonProps: {
      id: 'drawer-undo',
      children: createElement(Undo),
      visible: true,
    },
    groupName: 'drawer',
  };

  // Create redo button
  buttonConfigs.redo = {
    buttonProps: {
      id: 'drawer-redo',
      children: createElement(Redo),
      visible: true,
    },
    groupName: 'drawer',
  };

  // Create download button
  buttonConfigs.download = {
    buttonProps: {
      id: 'drawer-download',
      children: createElement(Download),
      visible: true,
    },
    groupName: 'drawer',
  };

  // Create upload button
  buttonConfigs.upload = {
    buttonProps: {
      id: 'drawer-upload',
      children: createElement(Upload),
      visible: true,
    },
    groupName: 'drawer',
  };

  // Create clear button
  buttonConfigs.clear = {
    buttonProps: {
      id: 'drawer-clear',
      children: createElement(Clear),
      visible: true,
    },
    groupName: 'drawer',
  };

  return buttonConfigs;
}

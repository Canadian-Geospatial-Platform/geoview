import { TypeNavBarButtonConfig } from 'geoview-core/api/plugin/navbar-plugin';
import { TypeDrawerConfig } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';
import { TypeWindow } from 'geoview-core/core/types/global-types';

import { logger } from 'geoview-core/core/utils/logger';

import Draw from './buttons/draw';
import GeometryPickerPanel, { GeometryPickerButton } from './buttons/geometry-picker';
import { StyleButton, StylePanel } from './buttons/style';
import Clear from './buttons/clear';
import Edit from './buttons/edit';
import Measurements from './buttons/measurements';

export function createDrawerButtons(config: TypeDrawerConfig): Record<string, TypeNavBarButtonConfig> {
  const { cgpv } = window as TypeWindow;
  const { createElement } = cgpv.reactUtilities.react;

  const geomTypes = config?.geomTypes || ['Point', 'LineString', 'Polygon', 'Circle'];
  const { CloseIcon } = cgpv.ui.elements;
  const buttonConfigs: Record<string, TypeNavBarButtonConfig> = {};

  logger.logInfo('Drawer Plugin - Creating draw button ...');
  // Create draw button
  buttonConfigs.draw = {
    buttonProps: {
      id: 'drawer-draw',
      children: createElement(Draw),
      visible: true,
    },
    groupName: 'drawer',
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

  buttonConfigs.edit = {
    buttonProps: {
      id: 'drawer-edit',
      children: createElement(Edit),
      visible: true,
    },
    groupName: 'drawer',
  };

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

  // Create show measure button
  buttonConfigs.measure = {
    buttonProps: {
      id: 'drawer-measure',
      children: createElement(Measurements),
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

import { TypeNavBarButtonConfig } from 'geoview-core/src/api/plugin/navbar-plugin';
import { TypeWindow } from 'geoview-core/src/core/types/global-types';

import { logger } from 'geoview-core/src/core/utils/logger';

import Draw from './buttons/draw';
import GeometryPicker from './buttons/geometry-picker';
import GeometryPickerPanel from './buttons/geometry-picker-panel';
import { StyleButton, StylePanel } from './buttons/style';
// import GeometryPickerButton from './buttons/geometry-picker-button';
import Clear from './buttons/clear';

type ConfigProps = {
  geomTypes: string[];
};

export function CloseButton(): JSX.Element {
  const { CloseIcon, IconButton } = (window as TypeWindow).cgpv.ui.elements;
  return (
    <IconButton>
      <CloseIcon />
    </IconButton>
  );
}

export function createDrawerButtons(config: ConfigProps): Record<string, TypeNavBarButtonConfig> {
  const { cgpv } = window as TypeWindow;
  const { geomTypes } = config;
  // const { CloseIcon } = cgpv.ui.elements;
  const buttonConfigs: Record<string, TypeNavBarButtonConfig> = {};

  logger.logInfo('Drawer Plugin - Creating draw button ...');
  // Create draw button
  buttonConfigs.draw = {
    buttonProps: {
      id: 'drawer-draw',
      tooltip: 'drawer.toggleDrawing',
      tooltipPlacement: 'left',
      children: cgpv.react.createElement(Draw),
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
      children: cgpv.react.createElement(GeometryPicker, { geomTypes }),
      visible: true,
    },
    groupName: 'drawer',
    panelProps: {
      title: 'drawer.geometryPicker',
      icon: cgpv.react.createElement(CloseButton),
      content: cgpv.react.createElement(GeometryPickerPanel, { geomTypes }),
      visible: false,
    },
  };

  buttonConfigs.style = {
    buttonProps: {
      id: 'drawer-style',
      tooltip: 'drawer.style',
      tooltipPlacement: 'left',
      children: cgpv.react.createElement(StyleButton),
      visible: true,
    },
    groupName: 'drawer',
    panelProps: {
      title: 'drawer.style',
      icon: cgpv.react.createElement(CloseButton),
      content: cgpv.react.createElement(StylePanel, { geomTypes }),
      visible: false,
    },
  };

  // Create clear button
  buttonConfigs.clear = {
    buttonProps: {
      id: 'drawer-clear',
      tooltip: 'drawer.clear',
      tooltipPlacement: 'left',
      children: cgpv.react.createElement(Clear),
      visible: true,
    },
    groupName: 'drawer',
  };

  return buttonConfigs;
}

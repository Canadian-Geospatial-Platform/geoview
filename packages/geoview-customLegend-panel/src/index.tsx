import { AppBarPlugin } from 'geoview-core/src/api/plugin/appbar-plugin';
import React from 'react';

export class LegendPanelPlugin extends AppBarPlugin {
  override schema() {
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          default: true,
        },
        width: {
          type: 'number',
          default: 350,
        },
      },
    };
  }

  override defaultConfig() {
    return {
      enabled: true,
      width: 350,
    };
  }

  id = 'legend-panel';

  override onCreateButtonProps() {
    return {
      id: this.id,
      tooltip: 'Legend',
      tooltipPlacement: 'right',
      children: '🗺️',
      visible: true,
    };
  }

  override onCreateContentProps() {
    return {
      title: 'Legend',
      width: 350,
      status: false,
    };
  }

  override onCreateContent(): JSX.Element {
    return React.createElement(
      'div',
      {
        style: {
          backgroundColor: '#ffffff',
          padding: '15px',
          height: '100%',
        },
      },
      'Legend Panel Content'
    );
  }
}

export default LegendPanelPlugin;

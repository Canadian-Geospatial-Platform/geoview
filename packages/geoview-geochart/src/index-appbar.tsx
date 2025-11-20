import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
import type { IconButtonPropsExtend } from 'geoview-core/ui/icon-button/icon-button';
import type { TypePanelProps } from 'geoview-core/ui/panel/panel-types';
import { AppBarPlugin } from 'geoview-core/api/plugin/appbar-plugin';
import { ChartIcon } from 'geoview-core/ui/icons';

import schema from '../schema.json';
import defaultConfig from '../default-config-geochart.json';

/**
 * The Chart Plugin which will be automatically instanciated during GeoView's initialization.
 */
export class GeoChartAppBarPlugin extends AppBarPlugin {
  /**
   * Return the package schema
   *
   * @returns {unknown} the package schema
   */
  override schema(): unknown {
    return schema;
  }

  /**
   * Return the default config for this package
   *
   * @returns {unknown} the default config
   */
  override defaultConfig(): unknown {
    return defaultConfig;
  }

  /**
   * Overrides the default translations for the Plugin.
   * @returns {Record<string, unknown>} - The translations object for the particular Plugin.
   */
  override defaultTranslations(): Record<string, unknown> {
    return {
      en: {
        chartPanel: {
          title: 'Chart',
        },
      },
      fr: {
        chartPanel: {
          title: 'Graphique',
        },
      },
    };
  }

  override onCreateButtonProps(): IconButtonPropsExtend {
    // Button props
    return {
      id: 'geoChartPanelButton',
      'aria-label': 'chartPanel.title',
      tooltipPlacement: 'right',
      children: <ChartIcon />,
      visible: true,
    };
  }

  override onCreateContentProps(): TypePanelProps {
    // Panel props
    return {
      title: 'chartPanel.title',
      icon: <ChartIcon />,
      width: '80vw',
    };
  }

  override onCreateContent(): JSX.Element {
    // Get cgpv
    // TODO: Create a geochart-appbar-panel equivalent to geochart-panel to hold the GeoChart itself and hook on the useGeochartConfigs store the same way geochart-panel does it
    // return <GeoChartAppBarPanel mapId={this.mapViewer.mapId} schemaValidator={new SchemaValidator()} />;
    return <div>Not implemented</div>;
  }

  /**
   * Callable plugin function to emit a Chart redraw event in order to update the Chart ui on demand.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  redrawChart(): void {
    // Emit a Chart Redraw event so the chart redraws
    // TODO: Implement the equivalent that's in the index.tsx file
  }
}

// Exports the GeoChartAppBarPlugin
export default GeoChartAppBarPlugin;

// GV This if condition took over 3 days to investigate. It was giving errors on the app.geo.ca website with
// GV some conflicting reacts being loaded on the page for some obscure reason.
// Check if we're on the right react
if (React === window.cgpv.reactUtilities.react) {
  // Keep a reference to the GeoChartPlugin as part of the geoviewPlugins property stored in the window object
  window.geoviewPlugins = window.geoviewPlugins || {};
  window.geoviewPlugins.geochart = GeoChartAppBarPlugin;
} // Else ignore, don't keep it on the window, wait for the right react load

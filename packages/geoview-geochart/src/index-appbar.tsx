import { Cast, AnySchemaObject, TypeIconButtonProps, TypePanelProps, toJsonObject, TypeJsonObject } from 'geoview-core';
import { AppBarPlugin } from 'geoview-core/src/api/plugin/appbar-plugin';
import { ChartIcon } from 'geoview-core/src/ui/icons';

import schema from '../schema.json';
import defaultConfig from '../default-config-geochart.json';

/**
 * The Chart Plugin which will be automatically instanciated during GeoView's initialization.
 */
export class GeoChartAppBarPlugin extends AppBarPlugin {
  /**
   * Return the package schema
   *
   * @returns {AnySchemaObject} the package schema
   */
  schema = (): AnySchemaObject => schema;

  /**
   * Return the default config for this package
   *
   * @returns {TypeJsonObject} the default config
   */
  defaultConfig = (): TypeJsonObject => toJsonObject(defaultConfig);

  /**
   * Translations object to inject to the viewer translations
   */
  translations = toJsonObject({
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
  });

  onCreateButtonProps(): TypeIconButtonProps {
    // Button props
    return {
      id: 'geoChartPanelButton',
      tooltip: 'chartPanel.title',
      tooltipPlacement: 'right',
      children: <ChartIcon />,
      visible: true,
    };
  }

  onCreateContentProps(): TypePanelProps {
    // Panel props
    return {
      title: 'chartPanel.title',
      icon: <ChartIcon />,
      width: '80vw',
      onPanelOpened: () => {
        // Redraw the chart, because of the canvas rendering
        this.redrawChart();
      },
    };
  }

  onCreateContent(): JSX.Element {
    // Fetch cgpv
    // TODO: Create a geochart-appbar-panel equivalent to geochart-panel to hold the GeoChart itself and hook on the useGeochartConfigs store the same way geochart-panel does it
    // return <GeoChartAppBarPanel mapId={this.pluginProps.mapId} schemaValidator={new SchemaValidator()} />;
    return <div>Not implemented</div>;
  }

  /**
   * Callable plugin function to emit a Chart redraw event in order to update the Chart ui on demand.
   */
  redrawChart = (): void => {
    // Emit a Chart Redraw event so the chart redraws
    // TODO: Implement the equivalent that's in the index.tsx file
  };
}

// Exports the GeoChartAppBarPlugin
export default GeoChartAppBarPlugin;

// Keep a reference to the GeoChartPlugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins.geochart = Cast<GeoChartAppBarPlugin>(GeoChartAppBarPlugin);

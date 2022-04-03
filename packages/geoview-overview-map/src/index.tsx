<<<<<<< HEAD
import { Cast, AbstractPluginClass, TypeJSONObject, TypeWindow } from 'geoview-core';
=======
import { TypeProps, TypeWindow } from 'geoview-core';
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d
import { OverviewMap } from './overview-map';

const w = window as TypeWindow;

/**
 * Create a class for the plugin instance
 */
class OverviewMapPlugin extends AbstractPluginClass {
  /**
   * translations object to inject to the viewer translations
   */
<<<<<<< HEAD
  translations: TypeJSONObject = {
=======
  translations: TypeProps<TypeProps<string>> = {
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d
    'en-CA': {},
    'fr-CA': {},
  };

  /**
   * Added function called after the plugin has been initialized
   */
  added = (): void => {
    const { mapId } = this.pluginOptions;

    // access the cgpv object from the window object
    const { cgpv } = w;

    // access the api calls
    const { api } = cgpv;

    const { language, projection, getMapOptions, currentProjection } = api.map(mapId);

    api
      .map(mapId)
      .addComponent(
        'overviewMap',
<<<<<<< HEAD
        <OverviewMap id={mapId} language={language} crs={projection.getCRS()} zoomFactor={getMapOptions(currentProjection).zoomFactor!} />
=======
        <OverviewMap id={mapId} language={language} crs={projection.getCRS()} zoomFactor={getMapOptions(currentProjection).zoomFactor} />
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d
      );
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  removed(): void {
    const { mapId } = this.pluginOptions;

    // access the cgpv object from the window object
    const { cgpv } = w;

    // access the api calls
    const { api } = cgpv;

    api.map(mapId).removeComponent('overviewMap');
  }
}

export default OverviewMapPlugin;

w.plugins = w.plugins || {};
w.plugins.overviewMap = Cast<AbstractPluginClass>(OverviewMapPlugin);

import { GVAbstractTester } from './abstract-gv-tester';
import { Test } from '../core/test';
import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { GeoCoreLayerConfigResponse } from 'geoview-core/api/config/geocore';
import { GeoCore } from 'geoview-core/api/config/geocore';
import type { TypeDisplayLanguage } from 'geoview-core/api/types/map-schema-types';

/**
 * Main Geocore testing class.
 * @extends {GVAbstractTester}
 */
export class GeocoreTester extends GVAbstractTester {
  /**
   * Constructs a GeocoreTester
   * @param {API} api - The api.
   * @param {string} mapViewer - The map viewer.
   */
  constructor(api: API, mapViewer: MapViewer) {
    super('GeocoreTester', api, mapViewer);
  }

  /**
   * Tests the Geocore service using Airborne Radioactivity information.
   * @returns {Promise<Test<GeoCoreLayerConfigResponse>>} A Promise that resolves with the Test containing the response from Geocore.
   */
  testStandaloneGeocoreWithAirborne(): Promise<Test<GeoCoreLayerConfigResponse>> {
    // The values
    const uuid = GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID;
    const language = 'en';
    const expectedConfig = {
      config: {
        geoviewLayerId: GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID,
        geoviewLayerType: 'esriDynamic',
        geoviewLayerName: GVAbstractTester.AIRBORNE_RADIOACTIVITY_LAYER_GROUP_NAME,
      },
      geocharts: {
        [GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX]: {
          layers: [],
          chart: 'line',
        },
      },
    };

    // Perform the test
    return this.test(
      'Test Geocore with Airborne',
      (test) => {
        // Redirect to helper to call geocore for a UUID
        return GeocoreTester.helperStepCallGeocoreForUUID(test, uuid, language);
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected geoview geocore config...');
        Test.assertJsonObject(result, expectedConfig);
      }
    );
  }

  /**
   * Calls the GeoCore service using the specified UUID and language, and returns the corresponding layer configuration.
   * Logs the step to the provided test instance.
   * @param {Test} test - The test instance used to log the call step.
   * @param {string} uuid - The GeoCore UUID used to request the layer configuration.
   * @param {TypeDisplayLanguage} language - The display language to use in the GeoCore request.
   * @returns {Promise<GeoCoreLayerConfigResponse>} A promise that resolves to the layer configuration returned by GeoCore.
   * @static
   */
  static helperStepCallGeocoreForUUID(test: Test, uuid: string, language: TypeDisplayLanguage): Promise<GeoCoreLayerConfigResponse> {
    // Update the step
    test.addStep(`Calling Geocore url for ${uuid}`);

    // Create a layer config from UUID using Geocore
    return GeoCore.createLayerConfigFromUUID(uuid, language, undefined, undefined);
  }
}

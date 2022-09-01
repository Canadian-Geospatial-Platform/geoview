import Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { VectorImage as VectorLayer } from 'ol/layer';
import { Options as VectorLayerOptions } from 'ol/layer/VectorImage';
import { Geometry } from 'ol/geom';
import { all } from 'ol/loadingstrategy';
import { EsriJSON, GeoJSON, KML } from 'ol/format';
import { Icon as StyleIcon, Style, Stroke, Fill, Circle as StyleCircle } from 'ol/style';
import { ReadOptions } from 'ol/format/Feature';
import { asArray, asString } from 'ol/color';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';

import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { TypeBaseVectorLayerEntryConfig, TypeLayerEntryConfig, TypeListOfLayerEntryConfig } from '../../../map/map-schema-types';
import { blueCircleIcon } from '../../../../core/types/marker-definitions';
import { api } from '../../../../app';
import { snackbarMessagePayload } from '../../../../api/events/payloads/snackbar-message-payload';
import { EVENT_NAMES } from '../../../../api/events/event-types';
import { getLocalizedValue, showMessage, setAlphaColor } from '../../../../core/utils/utilities';

/* *******************************************************************************************************************************
 * AbstractGeoViewVector types
 */

// Base type used to keep the layer's hierarchical structure. It is similar to ol/layer/Base~BaseLayer.
export type TypeBaseVectorLayer = BaseLayer; // TypeVectorLayerGroup | TypeVectorLayer;

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * The AbstractGeoViewVector class is a direct descendant of AbstractGeoViewLayer. As its name indicates, it is used to
 * instanciate GeoView vector layers. In addition to the components of the parent class, there is an attribute named
 * gvLayers where the vector elements of the class will be kept.
 *
 * The gvLayers attribute has a hierarchical structure. Its data type is TypetBaseVectorLayer. Subclasses of this type
 * are TypeVectorLayerGroup and TypeVectorLayer. The TypeVectorLayerGroup is a collection of TypetBaseVectorLayer. It is
 * important to note that a TypetBaseVectorLayer attribute can polymorphically refer to a TypeVectorLayerGroup or a
 * TypeVectorLayer. Here, we must not confuse instantiation and declaration of a polymorphic attribute.
 *
 * All leaves of the structure stored in the gvLayers attribute must be of type TypeVectorLayer. This is where the
 * features are placed and can be considered as a feature group.
 */
// ******************************************************************************************************************************
export abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
  /** Attribution used in the OpenLayer source. */
  attributions: string[] = [];

  /** Icon to use for point features. At creation time, a default value is provided. The icon can be changed. */
  iconToUse: StyleIcon = blueCircleIcon;

  /** ***************************************************************************************************************************
   * This method is used to create the layers specified in the listOfLayerEntryConfig attribute inherited from its parent.
   * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
   * Its code is the same for all child classes. It must first validate that the gvLayers attribute is null indicating
   * that the method has never been called before. If this is not the case, an error message must be sent. Then, it calls the
   * abstract method getAdditionalServiceDefinition. If the GeoView layer does not have a service definition, this method does
   * nothing. For example, when the child is a WFS service, this method executes the GetCapabilities request and saves the
   * result in an attribute of the class.
   *
   * The next operation is to instantiate each layer identified by the listOfLayerEntryConfig attribute. This is done using the
   * abstract method processOneLayerEntry. Then, a renderer is assigned to the newly created layer. The definition of the
   * renderers can come from the configuration of the GeoView layer or from the information saved by the method
   * getAdditionalServiceDefinition, priority being given to the first of the two. This operation is done by the abstract method
   * setRenderer. Note that if field aliases are used, they will be set at the same time as the renderer.
   *
   * Finally, the layer registers to all panels that offer this possibility. For example, if the layer is queryable, it could
   * subscribe to the details-panel and every time the user clicks on the map, the panel will ask the layer to return the
   * descriptive information of all the features in a tolerance radius. This information will be used to populate the
   * details-panel.
   */
  createGeoViewVectorLayers(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      if (this.gvLayers === null && this.listOfLayerEntryConfig.length !== 0) {
        this.getAdditionalServiceDefinition().then(() => {
          this.processListOfLayerEntryConfig(this.listOfLayerEntryConfig).then((layersCreated) => {
            this.gvLayers = layersCreated;
            resolve();
          });
        });
      } else {
        api.event.emit(
          snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.mapId, {
            type: 'key',
            value: 'validation.layer.createtwice',
            params: [this.mapId],
          })
        );
        // eslint-disable-next-line no-console
        console.log(`Can not execute twice the createGeoViewvectorLayers method for the map ${this.mapId}`);
        resolve();
      }
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * Process recursively the list of layer Entries to create the layers and the layer groups.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries to process.
   *
   * @returns {Promise<BaseLayer | null>} The promise that the layers were created.
   */
  private processListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): Promise<BaseLayer | null> {
    const promisedListOfLayerEntryProcessed = new Promise<BaseLayer | null>((resolve) => {
      if (listOfLayerEntryConfig.length === 1) {
        if (listOfLayerEntryConfig[0].entryType === 'group') {
          this.processListOfLayerEntryConfig(listOfLayerEntryConfig[0].listOfLayerEntryConfig).then((groupCreated) => {
            resolve(groupCreated);
          });
        } else {
          this.processOneLayerEntry(this.listOfLayerEntryConfig[0] as TypeBaseVectorLayerEntryConfig).then((vectorLayer) => {
            if (vectorLayer) {
              this.setRenderer(vectorLayer);
              this.registerToPanels(vectorLayer);
            } else {
              this.layerLoadError.push(this.listOfLayerEntryConfig[0].layerId);
            }
            resolve(vectorLayer);
          });
        }
      } else {
        const promiseOfLayerCreated: Promise<BaseLayer | null>[] = [];
        listOfLayerEntryConfig.forEach((layerEntry: TypeLayerEntryConfig) => {
          if (layerEntry.entryType === 'group') {
            promiseOfLayerCreated.push(this.processListOfLayerEntryConfig(layerEntry.listOfLayerEntryConfig));
          } else promiseOfLayerCreated.push(this.processOneLayerEntry(layerEntry as TypeBaseVectorLayerEntryConfig));
        });
        Promise.all(promiseOfLayerCreated)
          .then((listOfLayerCreated) => {
            if (listOfLayerCreated && listOfLayerCreated.length !== 0) {
              // We use the first element of the array to retrieve the parent node.
              const { parentLayerConfig } = listOfLayerCreated[0]!.get('layerEntryConfig');
              const layerGroup = this.createLayerGroup(parentLayerConfig);
              listOfLayerCreated.forEach((vectorLayer) => {
                if (vectorLayer) {
                  this.setRenderer(vectorLayer);
                  this.registerToPanels(vectorLayer);
                  (layerGroup as LayerGroup).getLayers().push(vectorLayer);
                } else {
                  this.layerLoadError.push(this.listOfLayerEntryConfig[0].layerId);
                }
              });
              resolve(layerGroup);
            } else resolve(null);
          })
          .catch((reason) => {
            // eslint-disable-next-line no-console
            console.log(reason);
            resolve(null);
          });
      }
    });
    return promisedListOfLayerEntryProcessed;
  }

  /** ***************************************************************************************************************************
   * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
   * If the GeoView layer does not have a service definition, this method does nothing.
   */
  abstract getAdditionalServiceDefinition(): Promise<void>;

  /** ***************************************************************************************************************************
   * This method creates a GeoView layer using the definition provided in the layerEntry parameter.
   *
   * @param {TypeLayerEntryConfig} layerEntry Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseVectorLayer} The GeoView vector layer that has been created.
   */
  processOneLayerEntry(layerEntry: TypeBaseVectorLayerEntryConfig): Promise<TypeBaseVectorLayer | null> {
    const promisedVectorLayer = new Promise<TypeBaseVectorLayer | null>((resolve) => {
      const vectorSource = this.createVectorSource(layerEntry);
      const vectorLayer = this.createVectorLayer(layerEntry, vectorSource);
      resolve(vectorLayer);
    });
    return promisedVectorLayer;
  }

  private createVectorSource(layerEntry: TypeBaseVectorLayerEntryConfig): VectorSource<Geometry> {
    // eslint-disable-next-line no-var
    var vectorSource: VectorSource<Geometry>;
    let readOptions: ReadOptions = {};
    const sourceOptions: SourceOptions = { strategy: all };
    if (this.attributions.length !== 0) sourceOptions.attributions = this.attributions;
    sourceOptions.url = getLocalizedValue(layerEntry.source!.dataAccessPath!, this.mapId);

    if (layerEntry.source!.format) {
      switch (layerEntry.source!.format) {
        case 'EsriJSON': {
          sourceOptions.url = `${sourceOptions.url}/query?f=pjson&outfields=*&where=1%3D1`;
          sourceOptions.format = new EsriJSON();
          break;
        }
        case 'GeoJSON': {
          readOptions = { dataProjection: layerEntry.source!.dataProjection };
          sourceOptions.format = new GeoJSON();
          break;
        }
        case 'featureAPI': {
          readOptions = { dataProjection: layerEntry.source!.dataProjection };
          sourceOptions.url = `${sourceOptions.url}/collections/${layerEntry.layerId}/items?f=json`;
          sourceOptions.format = new GeoJSON();
          break;
        }
        case 'KML': {
          sourceOptions.format = new KML();
          break;
        }
        case 'WFS': {
          readOptions = { dataProjection: layerEntry.source!.dataProjection };
          sourceOptions.format = new GeoJSON();
          sourceOptions.url = `${sourceOptions.url}?service=WFS&request=getFeature&outputFormat=application/json&version=2.0.0&srsname=${
            layerEntry.source!.dataProjection
          }&typeName=${layerEntry.layerId}`;
          break;
        }
        default: {
          showMessage(this.mapId, `createVectorSource error using ${layerEntry.source!.format} format.`);
          break;
        }
      }
    }

    sourceOptions.loader = (extent, resolution, projection, success, failure) => {
      const url = vectorSource.getUrl();
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url as string);
      const onError = () => {
        vectorSource.removeLoadedExtent(extent);
        if (failure) failure();
      };
      xhr.onerror = onError;
      xhr.onload = () => {
        if (xhr.status === 200) {
          const features = vectorSource.getFormat()!.readFeatures(xhr.responseText, {
            ...readOptions,
            featureProjection: projection,
            extent,
          }) as Feature<Geometry>[];
          vectorSource.addFeatures(features);
          if (success) success(features);
        } else {
          onError();
        }
      };
      xhr.send();
    };

    vectorSource = new VectorSource(sourceOptions);
    return vectorSource;
  }

  private createVectorLayer(layerEntry: TypeBaseVectorLayerEntryConfig, vectorSource: VectorSource<Geometry>): VectorLayer<VectorSource> {
    const defaultCircleMarkerStyle = new Style({
      image: new StyleCircle({
        radius: 5,
        stroke: new Stroke({
          color: asString(setAlphaColor(asArray('#000000'), 1)),
          width: 1,
        }),
        fill: new Fill({
          color: asString(setAlphaColor(asArray('#000000'), 0.4)),
        }),
      }),
    });

    const defaultLineStringStyle = new Style({
      stroke: new Stroke({
        color: asString(setAlphaColor(asArray('#000000'), 1)),
        width: 2,
      }),
    });

    const defaultLinePolygonStyle = new Style({
      stroke: new Stroke({
        // 1 is for opacity
        color: asString(setAlphaColor(asArray('#FF0000'), 1)),
        width: 2,
      }),
      fill: new Fill({
        color: asString(setAlphaColor(asArray('#FF0000'), 0.5)),
      }),
    });

    const defaultSelectStyle = new Style({
      stroke: new Stroke({
        color: asString(setAlphaColor(asArray('#0000FF'), 1)),
        width: 3,
      }),
      fill: new Fill({
        color: asString(setAlphaColor(asArray('#0000FF'), 0.5)),
      }),
    });

    const style: Record<string, Style> = {
      Polygon: defaultLinePolygonStyle,
      LineString: defaultLineStringStyle,
      Point: defaultCircleMarkerStyle,
    };

    const layerOptions: VectorLayerOptions<VectorSource> = {
      properties: { layerEntryConfig: layerEntry },
      source: vectorSource,
      // ! TODO: feature properties will be use when the renderer part of the object will be coded.
      style: (feature) => {
        const geometryType = feature.getGeometry()?.getType();

        return style[geometryType] ? style[geometryType] : defaultSelectStyle;
      },
    };

    return new VectorLayer(layerOptions);
  }

  /**
   * This method associate a renderer to the GeoView layer.
   *
   * @param {TypeBaseVectorLayer} vectorLayer The GeoView layer associated to the renderer.
   */
  abstract setRenderer(vectorLayer: TypeBaseVectorLayer): void;

  /**
   * This method register the GeoView layer to panels that offer this possibility.
   *
   * @param {TypeBaseVectorLayer} vectorLayer The GeoView layer who wants to register.
   */
  abstract registerToPanels(vectorLayer: TypeBaseVectorLayer): void;
}

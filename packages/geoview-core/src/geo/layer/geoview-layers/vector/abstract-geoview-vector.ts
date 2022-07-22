import axios from 'axios';

import Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { VectorImage as VectorLayer } from 'ol/layer';
import { Options as VectorLayerOptions } from 'ol/layer/VectorImage';
import { Geometry } from 'ol/geom';
import { all } from 'ol/loadingstrategy';
import { EsriJSON, GeoJSON, KML, WFS } from 'ol/format';
import { Icon as StyleIcon, Style } from 'ol/style';
import { StyleLike } from 'ol/style/Style';

import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import Collection from 'ol/Collection';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { TypeBaseVectorLayerConfig, TypeLayerConfig } from '../schema-types';
import { api, showMessage, TypeJsonObject } from '../../../../core/types/cgpv-types';
import { blueCircleIcon } from '../../../../core/types/marker-definitions';

/* *******************************************************************************************************************************
 * AbstractGeoViewVector types
 */

// Base type used to keep the layer's hierarchical structure. It is similar to ol/layer/Base~BaseLayer.
export type TypeBaseVectorLayer = BaseLayer; // TypeVectorLayerGroup | TypeVectorLayer;

/** ******************************************************************************************************************************
 * The AbstractGeoViewVector class is a direct descendant of AbstractGeoViewLayer. As its name indicates, it is used to
 * instanciate GeoView vector layers. In addition to the components of the parent class, there is an attribute named
 * gvVectorLayers where the vector elements of the class will be kept.
 *
 * The gvVectorLayers attribute has a hierarchical structure. Its data type is TypetBaseVectorLayer. Subclasses of this type
 * are TypeVectorLayerGroup and TypeVectorLayer. The TypeVectorLayerGroup is a collection of TypetBaseVectorLayer. It is
 * important to note that a TypetBaseVectorLayer attribute can polymorphically refer to a TypeVectorLayerGroup or a
 * TypeVectorLayer. Here, we must not confuse instantiation and declaration of a polymorphic attribute.
 *
 * All leaves of the structure stored in the gvVectorLayers attribute must be of type TypeVectorLayer. This is where the
 * features are placed and can be considered as a feature group.
 */
export abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
  /**
   * The vector layer structure to be displayed for this GeoView vector class. Initial value is null indicating that the layers
   * have not been created.
   */
  gvVectorLayers: TypeBaseVectorLayer | null = null;

  /** Attribution used in the OpenLayer source. */
  attributions: string[] = [];

  /** Icon to use for point features. At creation time, a default value is provided. The icon can be changed. */
  iconToUse: StyleIcon = blueCircleIcon;

  /**
   * This method is used to create the layers specified in the entries attribute inherited from its parent.
   * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
   * Its code is the same for all child classes. It must first validate that the gvVectorLayers attribute is null indicating
   * that the method has never been called before. If this is not the case, an error message must be sent. Then, it calls the
   * abstract method getAdditionalServiceDefinition. If the GeoView layer does not have a service definition, this method does
   * nothing. For example, when the child is a WFS service, this method executes the GetCapabilities request and saves the
   * result in an attribute of the class.
   *
   * The next operation is to instantiate each layer identified by the entries attribute. This is done using the abstract method
   * processOneLayerEntry. Then, a renderer is assigned to the newly created layer. The definition of the renderers can
   * come from the configuration of the GeoView layer or from the information saved by the method getAdditionalServiceDefinition,
   * priority being given to the first of the two. This operation is done by the abstract method setRenderer.
   * Note that if field aliases are used, they will be set at the same time as the renderer.
   *
   * Finally, the layer registers to all panels that offer this possibility. For example, if the layer is query able, it could
   * subscribe to the details-panel and every time the user clicks on the map, the panel will ask the layer to return the
   * descriptive information of all the features in a tolerance radius. This information will be used to populate the
   * details-panel.
   */
  createGeoViewVectorLayers() {
    if (this.gvVectorLayers === null && typeof this.layerEntries !== 'undefined') {
      this.getAdditionalServiceDefinition();
      if (this.layerEntries.length === 1) {
        this.gvVectorLayers = this.processOneLayerEntry(this.layerEntries[0] as TypeBaseVectorLayerConfig);
        if (this.gvVectorLayers) {
          this.setRenderer(this.layerEntries[0], this.gvVectorLayers);
          this.registerToPanels(this.layerEntries[0], this.gvVectorLayers);
        }
      } else {
        this.gvVectorLayers = new LayerGroup({
          layers: new Collection(),
        });
        this.layerEntries.forEach((layerEntry: TypeLayerConfig) => {
          const vectorLayer = this.processOneLayerEntry(layerEntry as TypeBaseVectorLayerConfig);
          if (vectorLayer) {
            this.setRenderer(layerEntry, vectorLayer);
            this.registerToPanels(layerEntry, vectorLayer);
            (this.gvVectorLayers as LayerGroup).getLayers().push(vectorLayer);
          }
        });
      }
    }
  }

  /**
   * This method reads from the accessPath additional information to complete the GeoView layer configuration.
   * If the GeoView layer does not have a service definition, this method does nothing.
   */
  abstract getAdditionalServiceDefinition(): void;

  /**
   * This method creates a GeoView layer using the definition provided in the layerEntry parameter.
   *
   * @param {TypeLayerConfig} layerEntry Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseVectorLayer} The GeoView vector layer that has been created.
   */
  processOneLayerEntry(layerEntry: TypeBaseVectorLayerConfig): TypeBaseVectorLayer | null {
    let vectorLayer: VectorLayer<VectorSource> | null = null;
    this.createLayer(layerEntry).then((result) => {
      vectorLayer = result;
    });
    return vectorLayer;
  }

  private async createLayer(layerEntry: TypeBaseVectorLayerConfig): Promise<VectorLayer<VectorSource> | null> {
    const promisedVectorLayer = new Promise<VectorLayer<VectorSource> | null>((resolve) => {
      let serviceUrl = this.accessPath[api.map(this.mapId).getLanguageCode()];
      serviceUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/query?f=pjson&outfields=*&where=1%3D1`;
      let data: TypeJsonObject = {};
      axios.get<TypeJsonObject>(serviceUrl).then((queryResponse) => {
        data = queryResponse.data;
      });

      const vectorSource = this.createVectorSource(layerEntry, data);

      const vectorLayer = this.createVectorLayer(layerEntry, vectorSource);
      resolve(vectorLayer);
    });
    return promisedVectorLayer;
  }

  private createVectorSource(layerEntry: TypeBaseVectorLayerConfig, response: TypeJsonObject): VectorSource<Geometry> {
    // eslint-disable-next-line no-var
    var vectorSource: VectorSource<Geometry>;
    const sourceOptions: SourceOptions = {};
    sourceOptions.strategy = all;
    if (this.attributions.length !== 0) sourceOptions.attributions = this.attributions;
    if (typeof layerEntry.source.accessPath !== undefined)
      sourceOptions.url = layerEntry.source.accessPath[api.map(this.mapId).getLanguageCode()];
    if (typeof layerEntry.source.format !== undefined) {
      switch (layerEntry.source.format) {
        case 'EsriJSON': {
          sourceOptions.format = new EsriJSON();
          break;
        }
        case 'GeoJSON': {
          sourceOptions.format = new GeoJSON();
          break;
        }
        case 'KML': {
          sourceOptions.format = new KML();
          break;
        }
        case 'WFS': {
          sourceOptions.format = new WFS();
          break;
        }
        default: {
          showMessage(this.mapId, `createVectorSource error using ${layerEntry.source.format} format.`);
          break;
        }
      }
    }

    sourceOptions.loader = (extent, resolution, projection, success, failure) => {
      if (response.error) {
        if (failure) failure();
      } else {
        // dataProjection will be read from document
        const features = sourceOptions.format!.readFeatures(response, {
          extent,
          featureProjection: projection,
        }) as Feature<Geometry>[];

        if (features.length > 0) {
          vectorSource.addFeatures(features);
        }

        if (success) success(features);
      }
    };

    vectorSource = new VectorSource(sourceOptions);
    return vectorSource;
  }

  private createVectorLayer(layerEntry: TypeBaseVectorLayerConfig, vectorSource: VectorSource<Geometry>): VectorLayer<VectorSource> {
    const layerOptions: VectorLayerOptions<VectorSource> = {
      properties: { layerConfig: layerEntry },
      source: vectorSource,
      style: ((feature: Feature) => {
        // ! TODO: feature properties will be use when the renderer part of the object will be coded.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const featureProperties = feature.getProperties();
        const { iconToUse } = this;

        const style = new Style({
          image: iconToUse,
        });

        // add style to feature
        feature.setStyle(style);

        return style;
      }) as StyleLike,
    };

    return new VectorLayer(layerOptions);
  }

  /**
   * This method associate a renderer to the GeoView layer.
   *
   * @param {TypeLayerConfig} layerEntry Information needed to create the renderer.
   * @param {TypeBaseVectorLayer} vectorLayer The GeoView layer associated to the renderer.
   */
  abstract setRenderer(layerEntry: TypeLayerConfig, vectorLayer: TypeBaseVectorLayer): void;

  /**
   * This method register the GeoView layer to panels that offer this possibility.
   *
   * @param {TypeLayerConfig} layerEntry Information needed to create the renderer.
   * @param {TypeBaseVectorLayer} vectorLayer The GeoView layer who wants to register.
   */
  abstract registerToPanels(layerEntry: TypeLayerConfig, vectorLayer: TypeBaseVectorLayer): void;
}

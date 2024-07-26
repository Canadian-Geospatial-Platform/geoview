import axios from 'axios';

import { Cast, TypeJsonArray, TypeJsonObject } from '@config/types/config-types';
import { codedValueType, Extent, rangeDomainType, TypeFeatureInfoLayerConfig, TypeOutfields } from '@config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/abstract-base-layer-entry-config';

import { logger } from '@/core/utils/logger';
import { DateMgt, TimeDimensionESRI } from '@/core/utils/date-mgt';
import { Projection } from '@/geo/utils/projection';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';

// #region CLASS HEADER
/**
 * Base type used to define the common implementation of an ESRI GeoView sublayer to display on the map.
 */
export abstract class AbstractBaseEsriLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  // #region PRIVATE METHODS
  /** ***************************************************************************************************************************
   * Convert the esri type to the type used by the viewer.
   *
   * @param {string} esriFieldType The ESRI field type.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  static #convertEsriFieldType(esriFieldType: string): 'string' | 'date' | 'number' {
    if (esriFieldType === 'esriFieldTypeDate') return 'date';
    if (
      ['esriFieldTypeDouble', 'esriFieldTypeInteger', 'esriFieldTypeSingle', 'esriFieldTypeSmallInteger', 'esriFieldTypeOID'].includes(
        esriFieldType
      )
    )
      return 'number';
    return 'string';
  }

  // #region PROTECTED METHODS
  /**
   * @protected
   * This method will create a Geoview temporal dimension if it exist in the service metadata.
   *
   * @param {TypeJsonObject} timeDimension The ESRI time dimension object.
   */
  // TODO: Issue #2139 - There is a bug with the temporal dimension returned by service URL:
  // TODO.CONT:  https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/Temporal_Test_Bed_fr/MapServer/0
  protected processTemporalDimension(timeDimension: TypeJsonObject): void {
    if (timeDimension?.timeExtent) {
      // The singleHandle property is True for ESRI Image and false for ESRI Feature and Dynamic.
      const singleHandle = false;
      this.temporalDimension = DateMgt.createDimensionFromESRI(Cast<TimeDimensionESRI>(timeDimension), singleHandle);
    }
  }

  /** ***************************************************************************************************************************
   * This method is used to parse the layer metadata and extract the style, source information and other properties.
   * @protected
   */
  protected parseLayerMetadata(): void {
    const layerMetadata = this.getLayerMetadata();

    this.minScale = layerMetadata.minScale as number;
    this.maxScale = layerMetadata.maxScale as number;

    const metadataExtent = [
      layerMetadata.extent.xmin,
      layerMetadata.extent.ymin,
      layerMetadata.extent.xmax,
      layerMetadata.extent.ymax,
    ] as Extent;
    const sourceProj = layerMetadata.extent.spatialReference.wkid;
    if (sourceProj === '4326') this.initialSettings.extent = validateExtentWhenDefined(metadataExtent);
    else
      this.initialSettings.extent = validateExtentWhenDefined(
        Projection.transformExtent(metadataExtent, `EPSG:${sourceProj}`, Projection.PROJECTION_NAMES.LNGLAT)
      );

    if (layerMetadata.defaultVisibility !== undefined) this.initialSettings.states!.visible = layerMetadata.defaultVisibility as boolean;

    this.initialSettings.states!.queryable = (layerMetadata?.capabilities as string)?.includes('Query') || false;

    if (layerMetadata.copyrightText) this.attributions.push(layerMetadata.copyrightText as string);
  }

  /** ***************************************************************************************************************************
   * This method creates the feature information from the layer metadata.
   *
   * @returns {TypeFeatureInfoLayerConfig} The feature information in the viewer format.
   */
  protected createFeatureInfoUsingMetadata(): TypeFeatureInfoLayerConfig {
    const layerMetadata = this.getLayerMetadata();
    const queryable = (layerMetadata?.capabilities as string)?.includes('Query') || false;

    const outfields: TypeOutfields[] = [];
    (layerMetadata.fields as TypeJsonArray).forEach((fieldEntry) => {
      if (layerMetadata.geometryField && fieldEntry?.name === layerMetadata.geometryField.name) return;
      outfields.push(
        Cast<TypeOutfields>({
          name: fieldEntry.name,
          alias: fieldEntry.alias,
          type: AbstractBaseEsriLayerEntryConfig.#convertEsriFieldType(fieldEntry.type as string),
          domaine: Cast<null | codedValueType | rangeDomainType>(fieldEntry.domain),
        })
      );
    });

    const nameField = (layerMetadata.displayField as string) || outfields[0].name;

    return { queryable, nameField, outfields };
  }

  // #region PUBLIC METHODS
  /** ***************************************************************************************************************************
   * This method is used to fetch, parse and extract the relevant information from the metadata of the leaf node.
   * The same method signature is used by layer group nodes and leaf nodes (layers).
   */
  override async fetchLayerMetadata(): Promise<void> {
    const serviceUrl = this.getGeoviewLayerConfig().metadataAccessPath;
    const queryUrl = serviceUrl.endsWith('/') ? `${serviceUrl}${this.layerId}` : `${serviceUrl}/${this.layerId}`;

    if (!this.getErrorDetectedFlag()) {
      try {
        const { data } = await axios.get<TypeJsonObject>(`${queryUrl}?f=json`);
        if ('error' in data) logger.logError('Error detected while reading layer metadata.', data.error);
        else {
          this.setLayerMetadata(data);
          this.parseLayerMetadata();
          return;
        }
      } catch (error) {
        logger.logError('Error detected while reading Layer metadata.', error);
      }
      this.setErrorDetectedFlag();
    }
    this.setLayerMetadata({});
  }
}

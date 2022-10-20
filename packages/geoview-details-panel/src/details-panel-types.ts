import { Coordinate, TypeJsonArray, TypeJsonObject, TypeJsonValue } from 'geoview-core/src/core/types/global-types';
import { AbstractGeoViewLayer } from 'geoview-core/src/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeButtonPanel } from 'geoview-core/src/ui/panel/panel-types';

export type TypeLayersEntry = {
  layerData: TypeJsonArray;
  groupLayer: boolean;
  displayField: string;
  fieldAliases: TypeJsonValue;
  layer: TypeLayerInfo;
  entries?: TypeEntry[];
  renderer: TypeRendererSymbol;
};

export type TypeLayerInfo = {
  layerPath: string;
  name: string;
  displayField: string;
  displayFieldName: string;
  drawingInfo: {
    renderer: TypeRendererSymbol;
  };
  fields: TypeFieldNameAliasArray;
};

export type TypeEntry = {
  attributes: TypeJsonObject;
};

export type TypeFieldAlias = { [name: string]: string };

export type TypeFoundLayers = {
  layer: TypeLayersEntry;
  entries: TypeEntry[];
};

export type TypeFieldNameAliasArray = {
  name: string;
  alias: string;
}[];

/**
 * Interface used for the Features List properties
 */
export type TypeFeaturesListProps = {
  buttonPanel: TypeButtonPanel;
  getSymbol: (renderer: TypeRendererSymbol, attributes: TypeJsonObject) => TypeJsonObject | null;
  selectFeature: (featureData: TypeJsonObject) => void;
  selectLayer: (layerData?: TypeLayersEntry) => void;
  // eslint-disable-next-line @typescript-eslint/ban-types
  selectedLayer: TypeLayersEntry | {};
  setPanel: (showLayersList: boolean, showFeaturesList: boolean, showFeaturesInfo: boolean) => void;
};

export type TypeRendererSymbol = {
  symbol: {
    contentType: string;
    label: string;
    legendImageUrl: string;
    type: 'simple' | 'uniqueValue';
  };
  uniqueValueInfos: TypeJsonArray;
  field1: string;
  field2: string;
  field3: string;
};

/**
 * Feature info properties
 */
export type TypeFeatureInfoProps = {
  buttonPanel: TypeButtonPanel;
  selectedFeature: TypeSelectedFeature;
  setPanel: (showLayersList: boolean, showFeaturesList: boolean, showFeaturesInfo: boolean) => void;
};

export type TypeSelectedFeature = {
  attributes: TypeJsonObject;
  displayField: TypeJsonObject;
  fieldAliases: TypeJsonObject;
  numOfEntries: number;
  symbol: TypeJsonObject;
};

/**
 * interface for the layers list properties in details panel
 */
export type TypeLayersListProps = {
  clickPos?: Coordinate;
  getSymbol: (renderer: TypeRendererSymbol, attributes: TypeJsonObject) => TypeJsonObject | null;
  layersData: Record<string, AbstractGeoViewLayer>;
  mapId: string;
  selectFeature: (featureData: TypeJsonObject) => void;
  selectLayer: (layerData?: TypeLayersEntry) => void;
};

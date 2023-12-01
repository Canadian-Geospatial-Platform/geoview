import { Extent } from 'ol/extent';
import { TypeGeoviewLayerType, TypeStyleConfig, TypeStyleGeometry, TypeVisibilityFlags } from '@/geo';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
export type TypeLayersViewDisplayState = 'remove' | 'add' | 'order' | 'view';
export type TypeLegendLayerIcons = TypeLegendLayerItem[];
export type TypeLegendLayerItem = {
    geometryType?: TypeStyleGeometry;
    iconType?: 'simple' | 'list';
    name?: string;
    iconImage?: string | null;
    iconImgStacked?: string | null;
    iconList?: TypeLegendLayerListItem[];
};
export interface TypeLegendLayerListItem {
    geometryType: TypeStyleGeometry;
    name: string;
    isVisible: TypeVisibilityFlags;
    icon: string | null;
    default: boolean;
}
export interface TypeLegendLayer {
    bounds: Extent | undefined;
    layerId: string;
    layerPath: string;
    layerAttribution?: string[];
    metadataAccessPath?: string;
    order?: number;
    layerName: string;
    type: TypeGeoviewLayerType;
    styleConfig?: TypeStyleConfig;
    layerStatus?: TypeLayerStatus;
    layerPhase?: string;
    querySent?: boolean;
    isVisible: TypeVisibilityFlags;
    icons?: TypeLegendLayerIcons;
    allItemsChecked?: boolean;
    items: TypeLegendLayerListItem[];
    children: TypeLegendLayer[];
    opacity?: number;
    zoom?: number;
    isRemovable?: boolean;
    canSetOpacity?: boolean;
}

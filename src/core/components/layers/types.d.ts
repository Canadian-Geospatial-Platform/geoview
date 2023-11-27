import { AbstractGeoViewLayer, TypeGeoviewLayerType, TypeLayerEntryConfig, TypeStyleConfig, TypeStyleGeometry, TypeVisibilityFlags } from '@/geo';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
export interface TypeLegendProps {
    layerIds: string[];
    isRemoveable?: boolean;
    canSetOpacity?: boolean;
    expandAll?: boolean;
    hideAll?: boolean;
    canZoomTo?: boolean;
}
export interface LegendItemsProps extends TypeLegendProps {
    mapId: string;
}
export interface LegendProps extends TypeLegendProps {
    mapId: string;
}
export interface LegendItemsDetailsProps extends TypeLegendProps {
    mapId: string;
}
export interface TypeLegendItemProps {
    layerId: string;
    geoviewLayerInstance: AbstractGeoViewLayer;
    subLayerId?: string;
    layerConfigEntry?: TypeLayerEntryConfig;
    isRemoveable?: boolean;
    canSetOpacity?: boolean;
    isParentVisible?: boolean;
    toggleParentVisible?: () => void;
    expandAll?: boolean;
    hideAll?: boolean;
}
export interface TypeLegendItemDetailsProps {
    layerId: string;
    geoviewLayerInstance: AbstractGeoViewLayer;
    subLayerId?: string;
    layerConfigEntry?: TypeLayerEntryConfig;
    isRemoveable?: boolean;
    canSetOpacity?: boolean;
    isParentVisible?: boolean;
    expandAll?: boolean;
    hideAll?: boolean;
}
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
    layerId: string;
    layerPath: string;
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

import { Extent } from 'ol/extent';
import { TypeLayerControls } from '@config/types/map-schema-types';
import { TypeLayerStatus, TypeLayerStyleConfig, TypeStyleGeometry } from '@/geo/map/map-schema-types';
import { TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
export type TypeLayersViewDisplayState = 'remove' | 'add' | 'order' | 'view';
export type TypeLegendLayerItem = {
    geometryType?: TypeStyleGeometry;
    iconType?: 'simple' | 'list';
    name?: string;
    iconImage?: string | null;
    iconImageStacked?: string | null;
    iconList?: TypeLegendItem[];
};
export interface TypeLegendItem {
    geometryType: TypeStyleGeometry;
    name: string;
    isVisible: boolean;
    icon: string | null;
}
export interface TypeLegendLayer {
    bounds: Extent | undefined;
    controls?: TypeLayerControls;
    layerId: string;
    layerPath: string;
    layerAttribution?: string[];
    layerName: string;
    legendQueryStatus: string;
    type?: TypeGeoviewLayerType;
    styleConfig?: TypeLayerStyleConfig | null;
    layerStatus?: TypeLayerStatus;
    querySent?: boolean;
    canToggle?: boolean;
    icons: TypeLegendLayerItem[];
    items: TypeLegendItem[];
    children: TypeLegendLayer[];
    opacity?: number;
    opacityFromParent?: number;
    zoom?: number;
}

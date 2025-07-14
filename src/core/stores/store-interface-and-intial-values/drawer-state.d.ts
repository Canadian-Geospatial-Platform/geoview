import { Draw } from '@/geo/interaction/draw';
import { Modify } from '@/geo/interaction/modify';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
type DrawerActions = IDrawerState['actions'];
export type StyleProps = {
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
};
export type TypeDrawerConfig = {
    activeGeom?: string;
    geomTypes?: string[];
    style?: StyleProps;
    hideMeasurements?: boolean;
};
export type TypeEditInstance = {
    [groupKey: string]: Modify | undefined;
};
export interface IDrawerState {
    activeGeom: string;
    geomTypes: string[];
    style: StyleProps;
    drawInstance: Draw | undefined;
    isEditing: boolean;
    editInstances: TypeEditInstance;
    hideMeasurements: boolean;
    iconSrc: string;
    setDefaultConfigValues: (config: TypeMapFeaturesConfig) => void;
    actions: {
        getActiveGeom: () => string;
        getGeomTypes: () => string[];
        getStyle: () => StyleProps;
        getIsDrawing: () => boolean;
        getDrawInstance: () => Draw | undefined;
        getIsEditing: () => boolean;
        getEditInstances: () => TypeEditInstance;
        getHideMeasurements: () => boolean;
        getIconSrc: () => string;
        toggleDrawing: () => void;
        toggleEditing: () => void;
        toggleHideMeasurements: () => void;
        clearDrawings: () => void;
        setActiveGeom(geomType: string): void;
        setStyle(style: StyleProps): void;
        setFillColor(fillColor: string): void;
        setStrokeColor(strokeColor: string): void;
        setStrokeWidth(strokeWidth: number): void;
        setDrawInstance(drawInstance: Draw): void;
        removeDrawInstance(): void;
        setIsEditing: (isEditing: boolean) => void;
        setEditInstance(groupKey: string, editInstance: Modify | undefined): void;
        removeEditInstance(groupKey: string): void;
        setHideMeasurements(hideMeasurements: boolean): void;
        setIconSrc: (iconSrc: string) => void;
    };
    setterActions: {
        toggleDrawing: () => void;
        toggleEditing: () => void;
        toggleHideMeasurements: () => void;
        clearDrawings: () => void;
        setActiveGeom: (geomType: string) => void;
        setStyle: (style: StyleProps) => void;
        setFillColor: (fillColor: string) => void;
        setStrokeColor: (strokeColor: string) => void;
        setStrokeWidth: (strokeWidth: number) => void;
        setDrawInstance: (drawInstance: Draw) => void;
        removeDrawInstance: () => void;
        setIsEditing: (isEditing: boolean) => void;
        setEditInstance: (groupKey: string, editInstance: Modify | undefined) => void;
        removeEditInstance: (groupKey: string) => void;
        setHideMeasurements: (hideMeasurements: boolean) => void;
        setIconSrc: (iconSrc: string) => void;
    };
}
/**
 * Initializes a Drawer state object.
 * @param {TypeSetStore} set - The store set callback function
 * @param {TypeSetStore} get - The store get callback function
 * @returns {IDrawerState} - The Drawer state object
 */
export declare function initializeDrawerState(set: TypeSetStore, get: TypeGetStore): IDrawerState;
export declare const useDrawerIsDrawing: () => boolean;
export declare const useDrawerIsEditing: () => boolean;
export declare const useDrawerActiveGeom: () => string;
export declare const useDrawerStyle: () => StyleProps;
export declare const useDrawerDrawInstance: () => Draw | undefined;
export declare const useDrawerHideMeasurements: () => boolean;
export declare const useDrawerActions: () => DrawerActions;
export {};
//# sourceMappingURL=drawer-state.d.ts.map
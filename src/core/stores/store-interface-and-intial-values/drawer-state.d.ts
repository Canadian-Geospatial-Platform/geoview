import { Feature } from 'ol';
import { Draw } from '@/geo/interaction/draw';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { Transform } from '@/geo/interaction/transform/transform';
type DrawerActions = IDrawerState['actions'];
export type StyleProps = {
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    text?: string;
    textSize?: number;
    textFont?: string;
    textColor?: string;
    textHaloColor?: string;
    textHaloWidth?: number;
};
export type TypeDrawerConfig = {
    activeGeom?: string;
    geomTypes?: string[];
    style?: StyleProps;
    hideMeasurements?: boolean;
};
export interface IDrawerState {
    activeGeom: string;
    geomTypes: string[];
    style: StyleProps;
    drawInstance: Draw | undefined;
    isEditing: boolean;
    transformInstance: Transform | undefined;
    selectedDrawing: Feature | undefined;
    hideMeasurements: boolean;
    iconSrc: string;
    undoDisabled: boolean;
    redoDisabled: boolean;
    setDefaultConfigValues: (config: TypeMapFeaturesConfig) => void;
    actions: {
        getActiveGeom: () => string;
        getGeomTypes: () => string[];
        getStyle: () => StyleProps;
        getIsDrawing: () => boolean;
        getDrawInstance: () => Draw | undefined;
        getIsEditing: () => boolean;
        getTransformInstance: () => Transform;
        getSelectedDrawing: () => Feature | undefined;
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
        setTransformInstance(transformInstance: Transform): void;
        removeTransformInstance(): void;
        setSelectedDrawing(selectedDrawing: Feature | undefined): void;
        setHideMeasurements(hideMeasurements: boolean): void;
        setIconSrc: (iconSrc: string) => void;
        undoDrawing: () => void;
        setUndoDisabled: (undoDisabled: boolean) => void;
        redoDrawing: () => void;
        setRedoDisabled: (redoDisabled: boolean) => void;
        downloadDrawings: () => void;
        uploadDrawings: (file: File) => void;
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
        setTransformInstance: (transformInstance: Transform) => void;
        removeTransformInstance: () => void;
        setSelectedDrawing: (selectedDrawing: Feature | undefined) => void;
        setHideMeasurements: (hideMeasurements: boolean) => void;
        setIconSrc: (iconSrc: string) => void;
        setUndoDisabled: (undoDisabled: boolean) => void;
        setRedoDisabled: (redoDisabled: boolean) => void;
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
export declare const useDrawerUndoDisabled: () => boolean;
export declare const useDrawerRedoDisabled: () => boolean;
export declare const useDrawerActions: () => DrawerActions;
export {};
//# sourceMappingURL=drawer-state.d.ts.map
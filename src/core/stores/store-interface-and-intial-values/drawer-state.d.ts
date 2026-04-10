import type { Feature } from 'ol';
import type { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import type { Draw } from '@/geo/interaction/draw';
import type { Snap } from '@/geo/interaction/snap';
import type { Transform } from '@/geo/interaction/transform/transform';
/** Represents the Drawer plugin state managed by the Zustand store. */
export interface IDrawerState {
    /** The currently active geometry type for drawing. */
    activeGeom: string;
    /** The list of available geometry types. */
    geomTypes: string[];
    /** The current drawing style properties. */
    style: StyleProps;
    /**
     * The active Draw interaction instance, or undefined when not drawing.
     *
     * @deprecated This class instance shouldn't be in the store, remove this property
     */
    drawInstance: Draw | undefined;
    /** Whether the drawer is in editing mode. */
    isEditing: boolean;
    /**
     * The active Transform interaction instance, or undefined when not editing.
     *
     * @deprecated This class instance shouldn't be in the store, remove this property
     */
    transformInstance: Transform | undefined;
    /** The currently selected drawing feature, or undefined. */
    selectedDrawing: Feature | undefined;
    /** The active Snap interaction instance, or undefined when snapping is disabled.
     *
     * @deprecated This class instance shouldn't be in the store, remove this property
     */
    snapInstance: Snap | undefined;
    /** Whether measurement overlays are hidden. */
    hideMeasurements: boolean;
    /** The icon source URL for point drawings. */
    iconSrc: string;
    /** Whether the undo action is disabled. */
    undoDisabled: boolean;
    /** Whether the redo action is disabled. */
    redoDisabled: boolean;
    /** Sets default drawer configuration values from the map features config. */
    setDefaultConfigValues: (config: TypeMapFeaturesConfig) => void;
    /** Actions to mutate the Drawer state. */
    actions: {
        setActiveGeom: (geomType: string) => void;
        setStyle: (style: StyleProps) => void;
        setFillColor: (fillColor: string) => void;
        setStrokeColor: (strokeColor: string) => void;
        setStrokeWidth: (strokeWidth: number) => void;
        setIconSize: (iconSize: number) => void;
        setTextValue: (text: string) => void;
        setTextSize: (textSize: number) => void;
        setTextFont: (textFont: string) => void;
        setTextColor: (textColor: string) => void;
        setTextHaloColor: (textHaloColor: string) => void;
        setTextHaloWidth: (textHaloWidth: number) => void;
        setTextBold: (textBold: boolean) => void;
        setTextItalic: (textItalic: boolean) => void;
        setTextRotation: (textRotation: number) => void;
        setDrawInstance: (drawInstance: Draw) => void;
        removeDrawInstance: () => void;
        setIsEditing: (isEditing: boolean) => void;
        setTransformInstance: (transformInstance: Transform) => void;
        removeTransformInstance: () => void;
        setSnapInstance: (snapInstance: Snap) => void;
        removeSnapInstance: () => void;
        setSelectedDrawing: (selectedDrawing: Feature | undefined) => void;
        setHideMeasurements: (hideMeasurements: boolean) => void;
        setIconSrc: (iconSrc: string) => void;
        setUndoDisabled: (undoDisabled: boolean) => void;
        setRedoDisabled: (redoDisabled: boolean) => void;
        updateStateStyle: (style: StyleProps) => void;
    };
}
/** Default text values per language for new text drawings. */
export declare const DEFAULT_TEXT_VALUES: {
    en: string;
    fr: string;
};
/**
 * Initializes a Drawer state object.
 *
 * @param set - The store set callback function
 * @param get - The store get callback function
 * @returns The Drawer state object
 */
export declare function initializeDrawerState(set: TypeSetStore, get: TypeGetStore): IDrawerState;
/**
 * Checks whether the drawer plugin state has been initialized for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if the drawer state is initialized, false otherwise.
 */
export declare const isStoreDrawerInitialized: (mapId: string) => boolean;
/**
 * Gets the active geometry type from the drawer store.
 *
 * @param mapId - The map identifier
 * @returns The active geometry type
 */
export declare const getStoreDrawerActiveGeom: (mapId: string) => string;
/** Hooks the active geometry type from the drawer state. */
export declare const useStoreDrawerActiveGeom: () => string;
/**
 * Gets the current drawing style from the drawer store.
 *
 * @param mapId - The map identifier
 * @returns The style properties
 */
export declare const getStoreDrawerStyle: (mapId: string) => StyleProps;
/** Hooks the current drawing style. */
export declare const useStoreDrawerStyle: () => StyleProps;
/**
 * Checks whether drawing mode is active.
 *
 * @param mapId - The map identifier
 * @returns True if a Draw instance is present
 */
export declare const getStoreDrawerIsDrawing: (mapId: string) => boolean;
/** Hooks whether drawing mode is active. */
export declare const useStoreDrawerIsDrawing: () => boolean;
/** Hooks the Draw interaction instance. */
export declare const useStoreDrawerDrawInstance: () => Draw | undefined;
/**
 * Checks whether editing mode is active.
 *
 * @param mapId - The map identifier
 * @returns True if a Transform instance is present
 */
export declare const getStoreDrawerIsEditing: (mapId: string) => boolean;
/** Hooks whether editing mode is active. */
export declare const useStoreDrawerIsEditing: () => boolean;
/**
 * Checks whether snapping mode is active.
 *
 * @param mapId - The map identifier
 * @returns True if a Snap instance is present
 */
export declare const getStoreDrawerIsSnapping: (mapId: string) => boolean;
/** Hooks whether snapping mode is active. */
export declare const useStoreDrawerIsSnapping: () => boolean;
/**
 * Gets the currently selected drawing feature from the store.
 *
 * @param mapId - The map identifier
 * @returns The selected feature, or undefined
 * @deprecated This class instance shouldn't be in the store, remove this selector
 */
export declare const getStoreDrawerSelectedDrawing: (mapId: string) => Feature | undefined;
/** Hooks the geometry type of the currently selected drawing. */
export declare const useStoreDrawerSelectedDrawing: () => string | undefined;
/**
 * Gets the hide measurements flag from the drawer store.
 *
 * @param mapId - The map identifier
 * @returns Whether measurements are hidden
 */
export declare const getStoreDrawerHideMeasurements: (mapId: string) => boolean;
/** Hooks whether measurements are hidden. */
export declare const useStoreDrawerHideMeasurements: () => boolean;
/**
 * Gets the Draw interaction instance from the store.
 *
 * @param mapId - The map identifier
 * @returns The Draw instance, or undefined
 * @deprecated This class instance shouldn't be in the store, remove this selector
 */
export declare const getStoreDrawerDrawInstance: (mapId: string) => Draw | undefined;
/**
 * Gets the Transform interaction instance from the store.
 *
 * @param mapId - The map identifier
 * @returns The Transform instance, or undefined
 * @deprecated This class instance shouldn't be in the store, remove this selector
 */
export declare const getStoreDrawerTransformInstance: (mapId: string) => Transform | undefined;
/**
 * Gets the Snap interaction instance from the store.
 *
 * @param mapId - The map identifier
 * @returns The Snap instance, or undefined
 * @deprecated This class instance shouldn't be in the store, remove this selector
 */
export declare const getStoreDrawerSnapInstance: (mapId: string) => Snap | undefined;
/**
 * Gets the available geometry types from the drawer store.
 *
 * @param mapId - The map identifier
 * @returns The array of geometry type strings
 */
export declare const getStoreDrawerGeomTypes: (mapId: string) => string[];
/**
 * Gets the geometry type of the currently selected drawing.
 *
 * @param mapId - The map identifier
 * @returns The drawing type string, or undefined if no selection
 */
export declare const getStoreDrawerSelectedDrawingType: (mapId: string) => string | undefined;
/**
 * Gets the icon source URL from the drawer store.
 *
 * @param mapId - The map identifier
 * @returns The icon source URL
 */
export declare const getStoreDrawerIconSrc: (mapId: string) => string;
/** Hooks whether the undo action is disabled. */
export declare const useStoreDrawerUndoDisabled: () => boolean;
/** Hooks whether the redo action is disabled. */
export declare const useStoreDrawerRedoDisabled: () => boolean;
/**
 * Sets the active geometry type in the drawer store.
 *
 * @param mapId - The map identifier
 * @param geomType - The geometry type to set as active
 */
export declare const setStoreActiveGeom: (mapId: string, geomType: string) => void;
/**
 * Sets the fill color in the drawer store.
 *
 * @param mapId - The map identifier
 * @param fillColor - The fill color value
 */
export declare const setStoreFillColor: (mapId: string, fillColor: string) => void;
/**
 * Sets the stroke color in the drawer store.
 *
 * @param mapId - The map identifier
 * @param strokeColor - The stroke color value
 */
export declare const setStoreStrokeColor: (mapId: string, strokeColor: string) => void;
/**
 * Sets the stroke width in the drawer store.
 *
 * @param mapId - The map identifier
 * @param strokeWidth - The stroke width value
 */
export declare const setStoreStrokeWidth: (mapId: string, strokeWidth: number) => void;
/**
 * Sets the icon size in the drawer store.
 *
 * @param mapId - The map identifier
 * @param iconSize - The icon size value
 */
export declare const setStoreDrawerIconSize: (mapId: string, iconSize: number) => void;
/**
 * Sets the text value in the drawer store.
 *
 * @param mapId - The map identifier
 * @param text - The text value
 */
export declare const setStoreTextValue: (mapId: string, text: string) => void;
/**
 * Sets the text size in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textSize - The text size value
 */
export declare const setStoreTextSize: (mapId: string, textSize: number) => void;
/**
 * Sets the text font in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textFont - The font family name
 */
export declare const setStoreTextFont: (mapId: string, textFont: string) => void;
/**
 * Sets the text color in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textColor - The text color value
 */
export declare const setStoreTextColor: (mapId: string, textColor: string) => void;
/**
 * Sets the text halo color in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textHaloColor - The text halo color value
 */
export declare const setStoreTextHaloColor: (mapId: string, textHaloColor: string) => void;
/**
 * Sets the text halo width in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textHaloWidth - The text halo width value
 */
export declare const setStoreTextHaloWidth: (mapId: string, textHaloWidth: number) => void;
/**
 * Sets the text bold state in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textBold - Whether text should be bold
 */
export declare const setStoreTextBold: (mapId: string, textBold: boolean) => void;
/**
 * Sets the text italic state in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textItalic - Whether text should be italic
 */
export declare const setStoreTextItalic: (mapId: string, textItalic: boolean) => void;
/**
 * Sets the text rotation in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textRotation - The text rotation angle in degrees
 */
export declare const setStoreTextRotation: (mapId: string, textRotation: number) => void;
/**
 * Sets the draw interaction instance in the drawer store.
 *
 * @param mapId - The map identifier
 * @param drawInstance - The Draw interaction instance
 * @deprecated This function shouldn't exist
 */
export declare const setStoreDrawInstance: (mapId: string, drawInstance: Draw) => void;
/** Removes the draw interaction instance from the drawer store.
 *
 * @param mapId - The map identifier
 * @deprecated This function shouldn't exist
 */
export declare const removeStoreDrawInstance: (mapId: string) => void;
/**
 * Sets the transform interaction instance in the drawer store.
 *
 * @param mapId - The map identifier
 * @param transformInstance - The Transform interaction instance
 * @deprecated This function shouldn't exist
 */
export declare const setStoreTransformInstance: (mapId: string, transformInstance: Transform) => void;
/** Removes the transform interaction instance from the drawer store.
 *
 * @param mapId - The map identifier
 * @deprecated This function shouldn't exist
 */
export declare const removeStoreTransformInstance: (mapId: string) => void;
/**
 * Sets the selected drawing feature in the drawer store.
 *
 * @param mapId - The map identifier
 * @param selectedDrawing - The selected feature, or undefined to clear selection
 * @deprecated This function shouldn't exist
 */
export declare const setStoreSelectedDrawing: (mapId: string, selectedDrawing: Feature | undefined) => void;
/**
 * Sets the snap interaction instance in the drawer store.
 *
 * @param mapId - The map identifier
 * @param snapInstance - The Snap interaction instance
 * @deprecated This function shouldn't exist
 */
export declare const setStoreSnapInstance: (mapId: string, snapInstance: Snap) => void;
/** Removes the snap interaction instance from the drawer store.
 *
 * @param mapId - The map identifier
 * @deprecated This function shouldn't exist
 */
export declare const removeStoreSnapInstance: (mapId: string) => void;
/**
 * Sets the hide measurements flag in the drawer store.
 *
 * @param mapId - The map identifier
 * @param hideMeasurements - Whether measurements should be hidden
 */
export declare const setStoreHideMeasurements: (mapId: string, hideMeasurements: boolean) => void;
/**
 * Sets the icon source URL in the drawer store.
 *
 * @param mapId - The map identifier
 * @param iconSrc - The icon source URL
 */
export declare const setStoreDrawerIconSrc: (mapId: string, iconSrc: string) => void;
/**
 * Sets the undo disabled state in the drawer store.
 *
 * @param mapId - The map identifier
 * @param undoDisabled - Whether undo should be disabled
 */
export declare const setStoreUndoDisabled: (mapId: string, undoDisabled: boolean) => void;
/**
 * Sets the redo disabled state in the drawer store.
 *
 * @param mapId - The map identifier
 * @param redoDisabled - Whether redo should be disabled
 */
export declare const setStoreRedoDisabled: (mapId: string, redoDisabled: boolean) => void;
/**
 * Updates the style state in the drawer store without triggering feature style refresh.
 *
 * @param mapId - The map identifier
 * @param style - The style properties to set
 */
export declare const updateStoreStateStyle: (mapId: string, style: StyleProps) => void;
/** Drawing style properties for fill, stroke, icon, and text. */
export type StyleProps = {
    /** The fill color (CSS color string). */
    fillColor: string;
    /** The stroke color (CSS color string). */
    strokeColor: string;
    /** The stroke width in pixels. */
    strokeWidth: number;
    /** Optional icon size in pixels. */
    iconSize?: number;
    /** Optional text content for text drawings. */
    text?: string;
    /** Optional text size in pixels. */
    textSize?: number;
    /** Optional text font family name. */
    textFont?: string;
    /** Optional text color (CSS color string). */
    textColor?: string;
    /** Optional text halo color (CSS color string). */
    textHaloColor?: string;
    /** Optional text halo width in pixels. */
    textHaloWidth?: number;
    /** Optional flag for bold text. */
    textBold?: boolean;
    /** Optional flag for italic text. */
    textItalic?: boolean;
    /** Optional text rotation angle in degrees. */
    textRotation?: number;
};
/** Configuration options for the drawer plugin from the map config. */
export type TypeDrawerConfig = {
    /** Optional initial active geometry type. */
    activeGeom?: string;
    /** Optional list of available geometry types. */
    geomTypes?: string[];
    /** Optional default drawing style overrides. */
    style?: StyleProps;
    /** Optional flag to hide measurements by default. */
    hideMeasurements?: boolean;
};
//# sourceMappingURL=drawer-state.d.ts.map
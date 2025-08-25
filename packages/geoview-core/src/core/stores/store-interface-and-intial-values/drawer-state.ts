import { useStore } from 'zustand';

import { Feature } from 'ol';
import { Draw } from '@/geo/interaction/draw';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { DrawerEventProcessor } from '@/api/event-processors/event-processor-children/drawer-event-processor';
import { Transform } from '@/geo/interaction/transform/transform';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with DrawerEventProcessor vs DrawerState

// #region INTERFACES & TYPES

type DrawerActions = IDrawerState['actions'];

export type StyleProps = {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  iconSize?: number;
  text?: string;
  textSize?: number;
  textFont?: string;
  textColor?: string;
  textHaloColor?: string;
  textHaloWidth?: number;
  textBold?: boolean;
  textItalic?: boolean;
  textRotation?: number;
};

export type TypeDrawerConfig = {
  activeGeom?: string;
  geomTypes?: string[];
  style?: StyleProps;
  hideMeasurements?: boolean;
};

type TypeNavBarPackageConfig = {
  drawer?: TypeDrawerConfig;
};

// Need Geometry Types array, but can get from config
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
    getSelectedDrawingType: () => string;
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
    updateFeatureStyle: () => void;
    updateStateStyle: (style: StyleProps) => void;
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
    setSelectedDrawing: (selectedDrawing: Feature | undefined) => void;
    setHideMeasurements: (hideMeasurements: boolean) => void;
    setIconSrc: (iconSrc: string) => void;
    setUndoDisabled: (undoDisabled: boolean) => void;
    setRedoDisabled: (redoDisabled: boolean) => void;
    updateStateStyle: (style: StyleProps) => void;
  };
}

// #endregion INTERFACES & TYPES

/**
 * Initializes a Drawer state object.
 * @param {TypeSetStore} set - The store set callback function
 * @param {TypeSetStore} get - The store get callback function
 * @returns {IDrawerState} - The Drawer state object
 */
// export function initializeDrawerState(set: TypeSetStore, get: TypeGetStore): IDrawerState {
export function initializeDrawerState(set: TypeSetStore, get: TypeGetStore): IDrawerState {
  const init = {
    activeGeom: 'Point',
    geomTypes: ['Point', 'Text', 'LineString', 'Polygon', 'Circle'],
    style: {
      fillColor: 'rgba(252, 241, 0, 0.3)',
      strokeColor: '#000000',
      strokeWidth: 1.3,
      iconSize: 24,
      text: 'Default Text',
      textSize: 14,
      textFont: 'Arial',
      textColor: '#000000',
      textHaloColor: 'rgba(255,255,255,0.7)',
      textHaloWidth: 3,
      textBold: false,
      textItalic: false,
      textRotation: 0,
    },
    drawInstance: undefined,
    isEditing: false,
    transformInstance: undefined,
    selectedDrawing: undefined,
    hideMeasurements: true,
    iconSrc: '',
    undoDisabled: true,
    redoDisabled: true,
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      const configObj = geoviewConfig.corePackagesConfig?.find((config) =>
        Object.keys(config).includes('drawer')
      ) as unknown as TypeNavBarPackageConfig;
      if (configObj) {
        const drawerConfig = configObj.drawer as TypeDrawerConfig;
        let initialGeomType = init.activeGeom;

        if (drawerConfig.activeGeom) {
          initialGeomType = drawerConfig.activeGeom;
        } else if (drawerConfig.geomTypes && drawerConfig.geomTypes.length > 0) {
          [initialGeomType] = drawerConfig.geomTypes;
        }

        set({
          drawerState: {
            ...get().drawerState,
            activeGeom: initialGeomType,
            geomTypes: drawerConfig.geomTypes || init.geomTypes,
            style: {
              ...init.style,
              ...(drawerConfig.style || {}),
            },
            hideMeasurements: drawerConfig.hideMeasurements ?? init.hideMeasurements,
          },
        });
      }
    },

    // #region ACTIONS

    actions: {
      getActiveGeom: () => {
        return get().drawerState.activeGeom;
      },
      getGeomTypes: () => {
        return get().drawerState.geomTypes;
      },
      getStyle: () => {
        return get().drawerState.style;
      },
      getIsDrawing: () => {
        return get().drawerState.drawInstance !== undefined;
      },
      getDrawInstance: () => {
        return get().drawerState.drawInstance;
      },
      getIsEditing: () => {
        return get().drawerState.transformInstance !== undefined;
      },
      getTransformInstance: () => {
        return get().drawerState.transformInstance;
      },
      getSelectedDrawing: () => {
        return get().drawerState.selectedDrawing;
      },
      getSelectedDrawingType: () => {
        const feature = get().drawerState.selectedDrawing;
        if (!feature) return undefined;
        if (feature.get('text')) return 'Text';
        // Only Point and LineString matter. Everything else treated as polygon
        const geometry = feature.getGeometry();
        return geometry?.getType();
      },
      getHideMeasurements: () => {
        return get().drawerState.hideMeasurements;
      },
      getIconSrc: () => {
        return get().drawerState.iconSrc;
      },
      toggleDrawing: () => {
        // Redirect to setter
        get().drawerState.setterActions.toggleDrawing();
      },
      toggleEditing: () => {
        // Redirect to setter
        get().drawerState.setterActions.toggleEditing();
      },
      toggleHideMeasurements: () => {
        // Redirect to setter
        get().drawerState.setterActions.toggleHideMeasurements();
      },
      clearDrawings: () => {
        // Redirect to setter
        get().drawerState.setterActions.clearDrawings();
      },
      setActiveGeom: (geomType: string) => {
        // Redirect to setter
        get().drawerState.setterActions.setActiveGeom(geomType);
      },
      setStyle: (style: StyleProps) => {
        // Redirect to setter
        get().drawerState.setterActions.setStyle(style);
      },
      setFillColor: (fillColor: string) => {
        // Redirect to setter
        get().drawerState.setterActions.setFillColor(fillColor);
      },
      setStrokeColor: (strokeColor: string) => {
        // Redirect to setter
        get().drawerState.setterActions.setStrokeColor(strokeColor);
      },
      setStrokeWidth: (strokeWidth: number) => {
        // Redirect to setter
        get().drawerState.setterActions.setStrokeWidth(strokeWidth);
      },
      setIconSize: (iconSize: number) => {
        // Redirect to setter
        get().drawerState.setterActions.setIconSize(iconSize);
      },
      setTextValue: (text: string) => {
        // Redirect to setter
        get().drawerState.setterActions.setTextValue(text);
      },
      setTextSize: (textSize: number) => {
        // Redirect to setter
        get().drawerState.setterActions.setTextSize(textSize);
      },
      setTextFont: (textFont: string) => {
        // Redirect to setter
        get().drawerState.setterActions.setTextFont(textFont);
      },
      setTextColor: (textColor: string) => {
        // Redirect to setter
        get().drawerState.setterActions.setTextColor(textColor);
      },
      setTextHaloColor: (textHaloColor: string) => {
        // Redirect to setter
        get().drawerState.setterActions.setTextHaloColor(textHaloColor);
      },
      setTextHaloWidth: (textHaloWidth: number) => {
        // Redirect to setter
        get().drawerState.setterActions.setTextHaloWidth(textHaloWidth);
      },
      setTextBold: (textBold: boolean) => {
        // Redirect to setter
        get().drawerState.setterActions.setTextBold(textBold);
      },
      setTextItalic: (textItalic: boolean) => {
        // Redirect to setter
        get().drawerState.setterActions.setTextItalic(textItalic);
      },
      setTextRotation: (textRotation: number) => {
        // Redirect to setter
        get().drawerState.setterActions.setTextRotation(textRotation);
      },
      setDrawInstance: (drawInstance: Draw) => {
        // Redirect to setter
        get().drawerState.setterActions.setDrawInstance(drawInstance);
      },
      removeDrawInstance: () => {
        // Redirect to setter
        get().drawerState.setterActions.removeDrawInstance();
      },
      setTransformInstance: (transformInstance: Transform) => {
        // Redirect to setter
        get().drawerState.setterActions.setTransformInstance(transformInstance);
      },
      removeTransformInstance: () => {
        // Redirect to setter
        get().drawerState.setterActions.removeTransformInstance();
      },
      setSelectedDrawing(selectedFeature: Feature) {
        // Redirect to setter
        get().drawerState.setterActions.setSelectedDrawing(selectedFeature);
      },
      setHideMeasurements: (hideMeasurements: boolean) => {
        // Redirect to setter
        get().drawerState.setterActions.setHideMeasurements(hideMeasurements);
      },
      setIconSrc: (iconSrc: string) => {
        // Redirect to setter
        get().drawerState.setterActions.setIconSrc(iconSrc);
      },
      undoDrawing: () => {
        // Undo previous drawing action
        DrawerEventProcessor.undo(get().mapId);
      },
      setUndoDisabled: (undoDisabled: boolean) => {
        // Redirect to setter
        get().drawerState.setterActions.setUndoDisabled(undoDisabled);
      },
      redoDrawing: () => {
        // Undo previous drawing action
        DrawerEventProcessor.redo(get().mapId);
      },
      setRedoDisabled(redoDisabled) {
        // Redirect to setter
        get().drawerState.setterActions.setRedoDisabled(redoDisabled);
      },
      downloadDrawings() {
        // Download drawings
        DrawerEventProcessor.downloadDrawings(get().mapId);
      },
      uploadDrawings(file: File) {
        // Upload drawings
        DrawerEventProcessor.uploadDrawings(get().mapId, file);
      },
      updateFeatureStyle() {
        // Refresh the draw instance with the new style
        if (get().drawerState.drawInstance !== undefined) {
          DrawerEventProcessor.startDrawing(get().mapId);
        }
        DrawerEventProcessor.updateTransformingFeatureStyle(get().mapId, get().drawerState.style);
      },
      updateStateStyle(style: StyleProps) {
        // Redirect to setter
        get().drawerState.setterActions.updateStateStyle(style);
      },
    },

    setterActions: {
      toggleDrawing: () => {
        DrawerEventProcessor.toggleDrawing(get().mapId);
      },

      toggleEditing: () => {
        DrawerEventProcessor.toggleEditing(get().mapId);
      },

      toggleHideMeasurements: () => {
        DrawerEventProcessor.toggleHideMeasurements(get().mapId);
      },

      clearDrawings: () => {
        DrawerEventProcessor.clearDrawings(get().mapId);
      },

      setActiveGeom: (geomType: string) => {
        set({
          drawerState: {
            ...get().drawerState,
            activeGeom: geomType,
          },
        });
        DrawerEventProcessor.refreshInteractionInstances(get().mapId);
      },

      setStyle: (style: StyleProps) => {
        set({
          drawerState: {
            ...get().drawerState,
            style,
          },
        });
        get().drawerState.actions.updateFeatureStyle();
      },

      setFillColor: (fillColor: string) => {
        set({
          drawerState: {
            ...get().drawerState,
            style: {
              ...get().drawerState.style,
              fillColor,
            },
          },
        });
        get().drawerState.actions.updateFeatureStyle();
      },

      setStrokeColor: (strokeColor: string) => {
        set({
          drawerState: {
            ...get().drawerState,
            style: {
              ...get().drawerState.style,
              strokeColor,
            },
          },
        });
        get().drawerState.actions.updateFeatureStyle();
      },

      setStrokeWidth: (strokeWidth: number) => {
        set({
          drawerState: {
            ...get().drawerState,
            style: {
              ...get().drawerState.style,
              strokeWidth,
            },
          },
        });
        get().drawerState.actions.updateFeatureStyle();
      },

      setIconSize: (iconSize: number) => {
        set({
          drawerState: {
            ...get().drawerState,
            style: {
              ...get().drawerState.style,
              iconSize,
            },
          },
        });
        get().drawerState.actions.updateFeatureStyle();
      },

      setTextValue: (text: string) => {
        set({
          drawerState: {
            ...get().drawerState,
            style: {
              ...get().drawerState.style,
              text,
            },
          },
        });
        get().drawerState.actions.updateFeatureStyle();
      },

      setTextSize: (textSize: number) => {
        set({
          drawerState: {
            ...get().drawerState,
            style: {
              ...get().drawerState.style,
              textSize,
            },
          },
        });
        get().drawerState.actions.updateFeatureStyle();
      },

      setTextFont: (textFont: string) => {
        set({
          drawerState: {
            ...get().drawerState,
            style: {
              ...get().drawerState.style,
              textFont,
            },
          },
        });
        get().drawerState.actions.updateFeatureStyle();
      },

      setTextColor: (textColor: string) => {
        set({
          drawerState: {
            ...get().drawerState,
            style: {
              ...get().drawerState.style,
              textColor,
            },
          },
        });
        get().drawerState.actions.updateFeatureStyle();
      },

      setTextHaloColor: (textHaloColor: string) => {
        set({
          drawerState: {
            ...get().drawerState,
            style: {
              ...get().drawerState.style,
              textHaloColor,
            },
          },
        });
        get().drawerState.actions.updateFeatureStyle();
      },

      setTextHaloWidth: (textHaloWidth: number) => {
        set({
          drawerState: {
            ...get().drawerState,
            style: {
              ...get().drawerState.style,
              textHaloWidth,
            },
          },
        });
        get().drawerState.actions.updateFeatureStyle();
      },

      setTextBold: (textBold: boolean) => {
        set({
          drawerState: {
            ...get().drawerState,
            style: {
              ...get().drawerState.style,
              textBold,
            },
          },
        });
        get().drawerState.actions.updateFeatureStyle();
      },

      setTextItalic: (textItalic: boolean) => {
        set({
          drawerState: {
            ...get().drawerState,
            style: {
              ...get().drawerState.style,
              textItalic,
            },
          },
        });
        get().drawerState.actions.updateFeatureStyle();
      },

      setTextRotation: (textRotation: number) => {
        set({
          drawerState: {
            ...get().drawerState,
            style: {
              ...get().drawerState.style,
              textRotation,
            },
          },
        });
        get().drawerState.actions.updateFeatureStyle();
      },

      setDrawInstance: (drawInstance: Draw) => {
        set({
          drawerState: {
            ...get().drawerState,
            drawInstance,
          },
        });
      },

      removeDrawInstance: () => {
        set({
          drawerState: {
            ...get().drawerState,
            drawInstance: undefined,
          },
        });
      },

      setTransformInstance: (transformInstance: Transform) => {
        set({
          drawerState: {
            ...get().drawerState,
            transformInstance,
          },
        });
      },

      removeTransformInstance: () => {
        set({
          drawerState: {
            ...get().drawerState,
            transformInstance: undefined,
          },
        });
      },

      setSelectedDrawing(selectedDrawing: Feature) {
        set({
          drawerState: {
            ...get().drawerState,
            selectedDrawing,
          },
        });
      },

      setHideMeasurements: (hideMeasurements: boolean) => {
        set({
          drawerState: {
            ...get().drawerState,
            hideMeasurements,
          },
        });
      },

      setIconSrc: (iconSrc: string) => {
        set({
          drawerState: {
            ...get().drawerState,
            iconSrc,
          },
        });
      },

      setUndoDisabled: (undoDisabled: boolean) => {
        set({
          drawerState: {
            ...get().drawerState,
            undoDisabled,
          },
        });
      },

      setRedoDisabled: (redoDisabled: boolean) => {
        set({
          drawerState: {
            ...get().drawerState,
            redoDisabled,
          },
        });
      },

      updateStateStyle: (style: StyleProps) => {
        set({
          drawerState: {
            ...get().drawerState,
            style,
          },
        });
      },
    },

    // #endregion ACTIONS
  } as IDrawerState;

  return init;
}

// **********************************************************
// Drawer state selectors
// **********************************************************

export const useDrawerIsDrawing = (): boolean => useStore(useGeoViewStore(), (state) => state.drawerState.actions.getIsDrawing());

export const useDrawerIsEditing = (): boolean => useStore(useGeoViewStore(), (state) => state.drawerState.actions.getIsEditing());

export const useDrawerSelectedDrawingType = (): string | undefined =>
  useStore(useGeoViewStore(), (state) => state.drawerState.actions.getSelectedDrawingType());

export const useDrawerActiveGeom = (): string => useStore(useGeoViewStore(), (state) => state.drawerState.activeGeom);

export const useDrawerStyle = (): StyleProps => useStore(useGeoViewStore(), (state) => state.drawerState.style);

export const useDrawerDrawInstance = (): Draw | undefined => useStore(useGeoViewStore(), (state) => state.drawerState.drawInstance);

export const useDrawerHideMeasurements = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.drawerState.actions.getHideMeasurements());

export const useDrawerUndoDisabled = (): boolean => useStore(useGeoViewStore(), (state) => state.drawerState.undoDisabled);

export const useDrawerRedoDisabled = (): boolean => useStore(useGeoViewStore(), (state) => state.drawerState.redoDisabled);

// Store Actions
export const useDrawerActions = (): DrawerActions => useStore(useGeoViewStore(), (state) => state.drawerState.actions);

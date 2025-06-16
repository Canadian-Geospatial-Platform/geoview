import { useStore } from 'zustand';

import { Draw } from '@/geo/interaction/draw';
import { Modify } from '@/geo/interaction/modify';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { DrawerEventProcessor } from '@/api/event-processors/event-processor-children/drawer-event-processor';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with DrawerEventProcessor vs DrawerState

// #region INTERFACES & TYPES

type DrawerActions = IDrawerState['actions'];

export type StyleProps = {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
};

export type TypeDrawerConfig = {
  drawer: {
    geomTypes?: string[];
    style?: StyleProps;
  };
};

export type TypeEditInstance = {
  [groupKey: string]: Modify | undefined;
};

// Need Geometry Types array, but can get from config
export interface IDrawerState {
  geomType: string;
  style: StyleProps;
  drawInstance: Draw | undefined;
  isEditing: boolean;
  editInstances: TypeEditInstance;

  setDefaultConfigValues: (config: TypeMapFeaturesConfig) => void;

  actions: {
    getIsDrawing: () => boolean;
    getIsEditing: () => boolean;
    toggleDrawing: () => void;
    toggleEditing: () => void;
    clearDrawings: () => void;
    setGeomType(geomType: string): void;
    setStyle(style: StyleProps): void;
    setFillColor(fillColor: string): void;
    setStrokeColor(strokeColor: string): void;
    setStrokeWidth(strokeWidth: number): void;
    setDrawInstance(drawInstance: Draw): void;
    removeDrawInstance(): void;
    setIsEditing: (isEditing: boolean) => void;
    setEditInstance(groupKey: string, editInstance: Modify | undefined): void;
    removeEditInstance(groupKey: string): void;
  };

  setterActions: {
    toggleDrawing: () => void;
    toggleEditing: () => void;
    clearDrawings: () => void;
    setGeomType: (geomType: string) => void;
    setStyle: (style: StyleProps) => void;
    setFillColor: (fillColor: string) => void;
    setStrokeColor: (strokeColor: string) => void;
    setStrokeWidth: (strokeWidth: number) => void;
    setDrawInstance: (drawInstance: Draw) => void;
    removeDrawInstance: () => void;
    setIsEditing: (isEditing: boolean) => void;
    setEditInstance: (groupKey: string, editInstance: Modify | undefined) => void;
    removeEditInstance: (groupKey: string) => void;
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
    geomType: 'Point',
    style: {
      fillColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 2,
    },
    drawInstance: undefined,
    editInstances: {},
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      const drawerConfig = geoviewConfig.corePackagesConfig?.find((config) => Object.keys(config).includes('drawer')) as
        | TypeDrawerConfig
        | undefined;
      if (drawerConfig?.drawer) {
        set({
          drawerState: {
            ...get().drawerState,
            geomType:
              drawerConfig.drawer.geomTypes !== undefined && drawerConfig.drawer.geomTypes.length > 0
                ? drawerConfig.drawer?.geomTypes[0]
                : 'Point',
            style: drawerConfig.drawer.style || {
              fillColor: '#FFFFFF',
              strokeColor: '#000000',
              strokeWidth: 2,
            },
          },
        });
      }
    },

    // #region ACTIONS

    actions: {
      getIsDrawing: () => {
        return get().drawerState.drawInstance !== undefined;
      },
      getIsEditing: () => {
        return get().drawerState.isEditing;
      },
      toggleDrawing: () => {
        // Redirect to setter
        get().drawerState.setterActions.toggleDrawing();
      },
      toggleEditing: () => {
        // Redirect to setter
        get().drawerState.setterActions.toggleEditing();
      },
      clearDrawings: () => {
        // Redirect to setter
        get().drawerState.setterActions.clearDrawings();
      },
      setGeomType: (geomType: string) => {
        // Redirect to setter
        get().drawerState.setterActions.setGeomType(geomType);
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
      setDrawInstance: (drawInstance: Draw) => {
        // Redirect to setter
        get().drawerState.setterActions.setDrawInstance(drawInstance);
      },
      removeDrawInstance: () => {
        // Redirect to setter
        get().drawerState.setterActions.removeDrawInstance();
      },
      setIsEditing: (isEditing: boolean) => {
        // Redirect to setter
        get().drawerState.setterActions.setIsEditing(isEditing);
      },
      setEditInstance: (groupKey: string, editInstance: Modify) => {
        // Redirect to setter
        get().drawerState.setterActions.setEditInstance(groupKey, editInstance);
      },
      removeEditInstance: (groupKey: string) => {
        // Redirect to setter
        get().drawerState.setterActions.removeEditInstance(groupKey);
      },
    },

    setterActions: {
      toggleDrawing: () => {
        DrawerEventProcessor.toggleDrawing(get().mapId);
      },

      toggleEditing: () => {
        DrawerEventProcessor.toggleEditing(get().mapId);
      },

      clearDrawings: () => {
        DrawerEventProcessor.clearDrawings(get().mapId);
      },

      setGeomType: (geomType: string) => {
        set({
          drawerState: {
            ...get().drawerState,
            geomType,
          },
        });
        DrawerEventProcessor.changeGeomType(get().mapId);
      },

      setStyle: (style: StyleProps) => {
        set({
          drawerState: {
            ...get().drawerState,
            style,
          },
        });
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
        if (get().drawerState.drawInstance !== undefined) {
          DrawerEventProcessor.startDrawing(get().mapId);
        }
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
        if (get().drawerState.drawInstance !== undefined) {
          DrawerEventProcessor.startDrawing(get().mapId);
        }
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
        if (get().drawerState.drawInstance !== undefined) {
          DrawerEventProcessor.startDrawing(get().mapId);
        }
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

      setIsEditing: (isEditing: boolean) => {
        set({
          drawerState: {
            ...get().drawerState,
            isEditing,
          },
        });
      },

      setEditInstance: (groupKey: string, editInstance: Modify) => {
        set({
          drawerState: {
            ...get().drawerState,
            editInstances: {
              ...get().drawerState.editInstances,
              [groupKey]: editInstance,
            },
          },
        });
      },

      removeEditInstance: (groupKey: string) => {
        const editInstances = { ...get().drawerState.editInstances };
        editInstances[groupKey] = undefined;
        set({
          drawerState: {
            ...get().drawerState,
            editInstances,
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

export const useDrawerStoreActions = (): DrawerActions => useStore(useGeoViewStore(), (state) => state.drawerState.actions);

export const useDrawerIsDrawing = (): boolean => useStore(useGeoViewStore(), (state) => state.drawerState.actions.getIsDrawing());

export const useDrawerIsEditing = (): boolean => useStore(useGeoViewStore(), (state) => state.drawerState.actions.getIsEditing());

export const useDrawerGeomType = (): string => useStore(useGeoViewStore(), (state) => state.drawerState.geomType);

export const useDrawerStyle = (): StyleProps => useStore(useGeoViewStore(), (state) => state.drawerState.style);

export const useDrawerDrawInstance = (): Draw | undefined => useStore(useGeoViewStore(), (state) => state.drawerState.drawInstance);

// Store Actions
export const useDrawerActions = (): DrawerActions => useStore(useGeoViewStore(), (state) => state.drawerState.actions);

import { useStore } from 'zustand';

import { Draw } from '@/geo/interaction/draw';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { DrawerEventProcessor } from '@/api/event-processors/event-processor-children/drawer-event-processor';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with DrawerEventProcessor vs DrawerState

// #region INTERFACES & TYPES

type DrawerActions = IDrawerState['actions'];

// TODO Currently duplicated, need to move to centralized location
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

// Need Geometry Types array, but can get from config
export interface IDrawerState {
  geomType: string;
  style: StyleProps;
  drawInstance: Draw | undefined;

  setDefaultConfigValues: (config: TypeMapFeaturesConfig) => void;

  actions: {
    getIsDrawing: () => boolean;
    toggleDrawing: () => void;
    clearDrawings: () => void;
    setGeomType(geomType: string): void;
    setStyle(style: StyleProps): void;
    setFillColor(fillColor: string): void;
    setStrokeColor(strokeColor: string): void;
    setStrokeWidth(strokeWidth: number): void;
    setDrawInstance(drawInstance: Draw): void;
    removeDrawInstance(): void;
  };

  setterActions: {
    toggleDrawing: () => void;
    clearDrawings: () => void;
    setGeomType: (geomType: string) => void;
    setStyle: (style: StyleProps) => void;
    setFillColor: (fillColor: string) => void;
    setStrokeColor: (strokeColor: string) => void;
    setStrokeWidth: (strokeWidth: number) => void;
    setDrawInstance: (drawInstance: Draw) => void;
    removeDrawInstance: () => void;
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
    drawInstance: undefined,
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
                : 'point',
            style: drawerConfig.drawer.style || {
              fillColor: '#',
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
      toggleDrawing: () => {
        // Redirect to setter
        get().drawerState.setterActions.toggleDrawing();
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
    },

    setterActions: {
      toggleDrawing: () => {
        DrawerEventProcessor.toggleDrawing(get().mapId);
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
        if (get().drawerState.drawInstance !== undefined) {
          DrawerEventProcessor.startDrawing(get().mapId);
        }
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
    },

    // #endregion ACTIONS
  } as IDrawerState;

  return init;
}

// **********************************************************
// Drawer state selectors
// **********************************************************

export const useDrawerStoreActions = (): DrawerActions => useStore(useGeoViewStore(), (state) => state.drawerState.actions);

export const useDrawerIsDrawing = (): boolean => useStore(useGeoViewStore(), (state) => state.drawerState.drawInstance !== undefined);

export const useDrawerGeomType = (): string => useStore(useGeoViewStore(), (state) => state.drawerState.geomType);

export const useDrawerStyle = (): StyleProps => useStore(useGeoViewStore(), (state) => state.drawerState.style);

export const useDrawerDrawInstance = (): Draw | undefined => useStore(useGeoViewStore(), (state) => state.drawerState.drawInstance);

// Store Actions
export const useDrawerActions = (): DrawerActions => useStore(useGeoViewStore(), (state) => state.drawerState.actions);

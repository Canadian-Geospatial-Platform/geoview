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
  activeGeom?: string;
  geomTypes?: string[];
  style?: StyleProps;
  hideMeasurements?: boolean;
};

type TypeNavBarPackageConfig = {
  drawer?: TypeDrawerConfig;
};

export type TypeEditInstance = {
  [groupKey: string]: Modify | undefined;
};

// Need Geometry Types array, but can get from config
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
    geomTypes: ['Point', 'LineString', 'Polygon', 'Circle'],
    style: {
      fillColor: 'rgba(252, 241, 0, 0.3)',
      strokeColor: '#000000',
      strokeWidth: 1.3,
    },
    drawInstance: undefined,
    isEditing: false,
    editInstances: {},
    hideMeasurements: true,
    iconSrc: '',
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
        return get().drawerState.isEditing;
      },
      getEditInstances: () => {
        return get().drawerState.editInstances;
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
      setHideMeasurements: (hideMeasurements: boolean) => {
        // Redirect to setter
        get().drawerState.setterActions.setHideMeasurements(hideMeasurements);
      },
      setIconSrc: (iconSrc: string) => {
        // Redirect to setter
        get().drawerState.setterActions.setIconSrc(iconSrc);
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
    },

    // #endregion ACTIONS
  } as IDrawerState;

  return init;
}

// **********************************************************
// Drawer state selectors
// **********************************************************

export const useDrawerIsDrawing = (): boolean => useStore(useGeoViewStore(), (state) => state.drawerState.actions.getIsDrawing());

export const useDrawerIsEditing = (): boolean => useStore(useGeoViewStore(), (state) => state.drawerState.isEditing);

export const useDrawerActiveGeom = (): string => useStore(useGeoViewStore(), (state) => state.drawerState.activeGeom);

export const useDrawerStyle = (): StyleProps => useStore(useGeoViewStore(), (state) => state.drawerState.style);

export const useDrawerDrawInstance = (): Draw | undefined => useStore(useGeoViewStore(), (state) => state.drawerState.drawInstance);

export const useDrawerHideMeasurements = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.drawerState.actions.getHideMeasurements());

// Store Actions
export const useDrawerActions = (): DrawerActions => useStore(useGeoViewStore(), (state) => state.drawerState.actions);

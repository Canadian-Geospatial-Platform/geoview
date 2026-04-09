import { useStore } from 'zustand';

import type { Feature } from 'ol';
import type { Geometry } from 'ol/geom';

import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { PluginStateUninitializedError } from '@/core/exceptions/geoview-exceptions';
import type { Draw } from '@/geo/interaction/draw';
import type { Snap } from '@/geo/interaction/snap';
import type { Transform } from '@/geo/interaction/transform/transform';

// #region INTERFACE DEFINITION

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

// #endregion INTERFACE DEFINITIONS

// #region UTIL FUNCTIONS (PRIVATE)

/**
 * Reads the geometry type of a drawing feature.
 *
 * Returns 'Text' if the feature has a text property, otherwise returns the
 * OpenLayers geometry type. Point and LineString are returned as-is;
 * all other types are treated as polygons by consumers.
 *
 * @param feature - The feature to read the drawing type from
 * @returns The drawing type string, or undefined if no feature is provided
 */
const utilReadDrawingType = (feature: Feature<Geometry> | undefined): string | undefined => {
  if (!feature) return undefined;
  if (feature.get('text')) return 'Text';
  // Only Point and LineString matter. Everything else treated as polygon
  const geometry = feature.getGeometry();
  return geometry?.getType();
};

// #endregion UTIL FUNCTIONS (PRIVATE)

// #region STATE INITIALIZATION

/** Default text values per language for new text drawings. */
export const DEFAULT_TEXT_VALUES = {
  en: 'Default Text',
  fr: 'Texte par défaut',
};

/**
 * Initializes a Drawer state object.
 *
 * @param set - The store set callback function
 * @param get - The store get callback function
 * @returns The Drawer state object
 */
export function initializeDrawerState(set: TypeSetStore, get: TypeGetStore): IDrawerState {
  const init = {
    activeGeom: 'Point',
    geomTypes: ['Point', 'Text', 'LineString', 'Polygon', 'Circle'],
    style: {
      fillColor: 'rgba(252, 241, 0, 0.3)',
      strokeColor: '#000000',
      strokeWidth: 1.3,
      iconSize: 24,
      text: DEFAULT_TEXT_VALUES[get().appState.displayLanguage],
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
    snapInstance: undefined,
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

    actions: {
      /**
       * Sets the active geometry type.
       *
       * @param geomType - The geometry type to set as active
       */
      setActiveGeom: (geomType: string) => {
        set({
          drawerState: {
            ...get().drawerState,
            activeGeom: geomType,
          },
        });
      },

      /**
       * Sets the drawing style.
       *
       * @param style - The style properties to apply
       */
      setStyle: (style: StyleProps) => {
        set({
          drawerState: {
            ...get().drawerState,
            style,
          },
        });
      },

      /**
       * Sets the fill color.
       *
       * @param fillColor - The fill color value
       */
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
      },

      /**
       * Sets the stroke color.
       *
       * @param strokeColor - The stroke color value
       */
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
      },

      /**
       * Sets the stroke width.
       *
       * @param strokeWidth - The stroke width value
       */
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
      },

      /**
       * Sets the icon size.
       *
       * @param iconSize - The icon size value
       */
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
      },

      /**
       * Sets the text value.
       *
       * @param text - The text content
       */
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
      },

      /**
       * Sets the text size.
       *
       * @param textSize - The text size value
       */
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
      },

      /**
       * Sets the text font.
       *
       * @param textFont - The font family name
       */
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
      },

      /**
       * Sets the text color.
       *
       * @param textColor - The text color value
       */
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
      },

      /**
       * Sets the text halo color.
       *
       * @param textHaloColor - The text halo color value
       */
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
      },

      /**
       * Sets the text halo width.
       *
       * @param textHaloWidth - The text halo width value
       */
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
      },

      /**
       * Sets the text bold state.
       *
       * @param textBold - Whether text should be bold
       */
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
      },

      /**
       * Sets the text italic state.
       *
       * @param textItalic - Whether text should be italic
       */
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
      },

      /**
       * Sets the text rotation angle.
       *
       * @param textRotation - The rotation angle in degrees
       */
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
      },

      /**
       * Sets the draw interaction instance.
       *
       * @param drawInstance - The OpenLayers Draw interaction
       */
      setDrawInstance: (drawInstance: Draw) => {
        set({
          drawerState: {
            ...get().drawerState,
            drawInstance,
          },
        });
      },

      /**
       * Removes the draw interaction instance.
       */
      removeDrawInstance: () => {
        set({
          drawerState: {
            ...get().drawerState,
            drawInstance: undefined,
          },
        });
      },

      /**
       * Sets the transform interaction instance.
       *
       * @param transformInstance - The OpenLayers Transform interaction
       */
      setTransformInstance: (transformInstance: Transform) => {
        set({
          drawerState: {
            ...get().drawerState,
            transformInstance,
          },
        });
      },

      /**
       * Removes the transform interaction instance.
       */
      removeTransformInstance: () => {
        set({
          drawerState: {
            ...get().drawerState,
            transformInstance: undefined,
          },
        });
      },

      /**
       * Sets the selected drawing feature.
       *
       * @param selectedDrawing - The selected feature
       */
      setSelectedDrawing(selectedDrawing: Feature) {
        set({
          drawerState: {
            ...get().drawerState,
            selectedDrawing,
          },
        });
      },

      /**
       * Sets the snap interaction instance.
       *
       * @param snapInstance - The OpenLayers Snap interaction
       */
      setSnapInstance(snapInstance: Snap) {
        set({
          drawerState: {
            ...get().drawerState,
            snapInstance,
          },
        });
      },

      /**
       * Removes the snap interaction instance.
       */
      removeSnapInstance() {
        set({
          drawerState: {
            ...get().drawerState,
            snapInstance: undefined,
          },
        });
      },

      /**
       * Sets whether measurements are hidden.
       *
       * @param hideMeasurements - Whether to hide measurements
       */
      setHideMeasurements: (hideMeasurements: boolean) => {
        set({
          drawerState: {
            ...get().drawerState,
            hideMeasurements,
          },
        });
      },

      /**
       * Sets the icon source URL.
       *
       * @param iconSrc - The icon source path
       */
      setIconSrc: (iconSrc: string) => {
        set({
          drawerState: {
            ...get().drawerState,
            iconSrc,
          },
        });
      },

      /**
       * Sets the undo button disabled state.
       *
       * @param undoDisabled - Whether undo is disabled
       */
      setUndoDisabled: (undoDisabled: boolean) => {
        set({
          drawerState: {
            ...get().drawerState,
            undoDisabled,
          },
        });
      },

      /**
       * Sets the redo button disabled state.
       *
       * @param redoDisabled - Whether redo is disabled
       */
      setRedoDisabled: (redoDisabled: boolean) => {
        set({
          drawerState: {
            ...get().drawerState,
            redoDisabled,
          },
        });
      },

      /**
       * Updates the drawing style state.
       *
       * @param style - The new style properties
       */
      updateStateStyle: (style: StyleProps) => {
        set({
          drawerState: {
            ...get().drawerState,
            style,
          },
        });
      },
    },
  } as IDrawerState;

  return init;
}

// #endregion STATE INITIALIZATION

// #region STATE GETTERS & HOOKS
// GV Getters should be used to get the values at a moment in time.
// GV Hooks should be used to attach to values and trigger UI components when they change.
// GV Typically they are listed in couples (getter + hook) for the same value.

/**
 * Returns the full drawer state slice for the given map.
 *
 * Internal-only selector - not exported to avoid direct store access from outside this module.
 *
 * @param mapId - The map identifier.
 * @returns The IDrawerState for the given map.
 */
// GV No export for the main state!
const getStoreDrawerState = (mapId: string): IDrawerState => {
  const state = getGeoViewStore(mapId).getState().drawerState;
  if (!state) throw new PluginStateUninitializedError('Drawer', mapId);
  return state;
};

/**
 * Checks whether the drawer plugin state has been initialized for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if the drawer state is initialized, false otherwise.
 */
export const isStoreDrawerInitialized = (mapId: string): boolean => {
  try {
    // Get its state, this will throw PluginStateUninitializedError if uninitialized
    getStoreDrawerState(mapId);
    return true;
  } catch {
    // Uninitialized
    return false;
  }
};

/**
 * Gets the active geometry type from the drawer store.
 *
 * @param mapId - The map identifier
 * @returns The active geometry type
 */
export const getStoreDrawerActiveGeom = (mapId: string): string => {
  return getStoreDrawerState(mapId).activeGeom;
};

/** Hooks the active geometry type from the drawer state. */
export const useStoreDrawerActiveGeom = (): string => useStore(useGeoViewStore(), (state) => state.drawerState.activeGeom);

/**
 * Gets the current drawing style from the drawer store.
 *
 * @param mapId - The map identifier
 * @returns The style properties
 */
export const getStoreDrawerStyle = (mapId: string): StyleProps => {
  return getStoreDrawerState(mapId).style;
};

/** Hooks the current drawing style. */
export const useStoreDrawerStyle = (): StyleProps => useStore(useGeoViewStore(), (state) => state.drawerState.style);

/**
 * Checks whether drawing mode is active.
 *
 * @param mapId - The map identifier
 * @returns True if a Draw instance is present
 */
export const getStoreDrawerIsDrawing = (mapId: string): boolean => {
  return getStoreDrawerState(mapId).drawInstance !== undefined;
};

/** Hooks whether drawing mode is active. */
export const useStoreDrawerIsDrawing = (): boolean => useStore(useGeoViewStore(), (state) => state.drawerState.drawInstance !== undefined);

/** Hooks the Draw interaction instance. */
export const useStoreDrawerDrawInstance = (): Draw | undefined => useStore(useGeoViewStore(), (state) => state.drawerState.drawInstance);

/**
 * Checks whether editing mode is active.
 *
 * @param mapId - The map identifier
 * @returns True if a Transform instance is present
 */
export const getStoreDrawerIsEditing = (mapId: string): boolean => {
  return getStoreDrawerState(mapId).transformInstance !== undefined;
};

/** Hooks whether editing mode is active. */
export const useStoreDrawerIsEditing = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.drawerState.transformInstance !== undefined);

/**
 * Checks whether snapping mode is active.
 *
 * @param mapId - The map identifier
 * @returns True if a Snap instance is present
 */
export const getStoreDrawerIsSnapping = (mapId: string): boolean => {
  return getStoreDrawerState(mapId).snapInstance !== undefined;
};

/** Hooks whether snapping mode is active. */
export const useStoreDrawerIsSnapping = (): boolean => useStore(useGeoViewStore(), (state) => state.drawerState.snapInstance !== undefined);

/**
 * Gets the currently selected drawing feature from the store.
 *
 * @param mapId - The map identifier
 * @returns The selected feature, or undefined
 * @deprecated This class instance shouldn't be in the store, remove this selector
 */
export const getStoreDrawerSelectedDrawing = (mapId: string): Feature | undefined => {
  return getStoreDrawerState(mapId).selectedDrawing;
};

/** Hooks the geometry type of the currently selected drawing. */
export const useStoreDrawerSelectedDrawing = (): string | undefined =>
  useStore(useGeoViewStore(), (state) => utilReadDrawingType(state.drawerState.selectedDrawing));

/**
 * Gets the hide measurements flag from the drawer store.
 *
 * @param mapId - The map identifier
 * @returns Whether measurements are hidden
 */
export const getStoreDrawerHideMeasurements = (mapId: string): boolean => {
  return getStoreDrawerState(mapId).hideMeasurements;
};

/** Hooks whether measurements are hidden. */
export const useStoreDrawerHideMeasurements = (): boolean => useStore(useGeoViewStore(), (state) => state.drawerState.hideMeasurements);

// #endregion STATE GETTERS & HOOKS

// #region STATE GETTERS & HOOKS - OTHERS (no match between getter-hook)

/**
 * Gets the Draw interaction instance from the store.
 *
 * @param mapId - The map identifier
 * @returns The Draw instance, or undefined
 * @deprecated This class instance shouldn't be in the store, remove this selector
 */
export const getStoreDrawerDrawInstance = (mapId: string): Draw | undefined => {
  return getStoreDrawerState(mapId).drawInstance;
};

/**
 * Gets the Transform interaction instance from the store.
 *
 * @param mapId - The map identifier
 * @returns The Transform instance, or undefined
 * @deprecated This class instance shouldn't be in the store, remove this selector
 */
export const getStoreDrawerTransformInstance = (mapId: string): Transform | undefined => {
  return getStoreDrawerState(mapId).transformInstance;
};

/**
 * Gets the Snap interaction instance from the store.
 *
 * @param mapId - The map identifier
 * @returns The Snap instance, or undefined
 * @deprecated This class instance shouldn't be in the store, remove this selector
 */
export const getStoreDrawerSnapInstance = (mapId: string): Snap | undefined => {
  return getStoreDrawerState(mapId).snapInstance;
};

/**
 * Gets the available geometry types from the drawer store.
 *
 * @param mapId - The map identifier
 * @returns The array of geometry type strings
 */
export const getStoreDrawerGeomTypes = (mapId: string): string[] => {
  return getStoreDrawerState(mapId).geomTypes;
};

/**
 * Gets the geometry type of the currently selected drawing.
 *
 * @param mapId - The map identifier
 * @returns The drawing type string, or undefined if no selection
 */
export const getStoreDrawerSelectedDrawingType = (mapId: string): string | undefined => {
  return utilReadDrawingType(getStoreDrawerSelectedDrawing(mapId));
};

/**
 * Gets the icon source URL from the drawer store.
 *
 * @param mapId - The map identifier
 * @returns The icon source URL
 */
export const getStoreDrawerIconSrc = (mapId: string): string => {
  return getStoreDrawerState(mapId).iconSrc;
};

/** Hooks whether the undo action is disabled. */
export const useStoreDrawerUndoDisabled = (): boolean => useStore(useGeoViewStore(), (state) => state.drawerState.undoDisabled);

/** Hooks whether the redo action is disabled. */
export const useStoreDrawerRedoDisabled = (): boolean => useStore(useGeoViewStore(), (state) => state.drawerState.redoDisabled);

// #endregion STATE GETTERS & HOOKS - OTHERS (no match between getter-hook)

// #region STATE ADAPTORS
// GV These methods should be called from a State Adaptor class listening on domain events triggered by controllers.

/**
 * Sets the active geometry type in the drawer store.
 *
 * @param mapId - The map identifier
 * @param geomType - The geometry type to set as active
 */
export const setStoreActiveGeom = (mapId: string, geomType: string): void => {
  getStoreDrawerState(mapId).actions.setActiveGeom(geomType);
};

/**
 * Sets the fill color in the drawer store.
 *
 * @param mapId - The map identifier
 * @param fillColor - The fill color value
 */
export const setStoreFillColor = (mapId: string, fillColor: string): void => {
  getStoreDrawerState(mapId).actions.setFillColor(fillColor);
};

/**
 * Sets the stroke color in the drawer store.
 *
 * @param mapId - The map identifier
 * @param strokeColor - The stroke color value
 */
export const setStoreStrokeColor = (mapId: string, strokeColor: string): void => {
  getStoreDrawerState(mapId).actions.setStrokeColor(strokeColor);
};

/**
 * Sets the stroke width in the drawer store.
 *
 * @param mapId - The map identifier
 * @param strokeWidth - The stroke width value
 */
export const setStoreStrokeWidth = (mapId: string, strokeWidth: number): void => {
  getStoreDrawerState(mapId).actions.setStrokeWidth(strokeWidth);
};

/**
 * Sets the icon size in the drawer store.
 *
 * @param mapId - The map identifier
 * @param iconSize - The icon size value
 */
export const setStoreDrawerIconSize = (mapId: string, iconSize: number): void => {
  getStoreDrawerState(mapId).actions.setIconSize(iconSize);
};

/**
 * Sets the text value in the drawer store.
 *
 * @param mapId - The map identifier
 * @param text - The text value
 */
export const setStoreTextValue = (mapId: string, text: string): void => {
  getStoreDrawerState(mapId).actions.setTextValue(text);
};

/**
 * Sets the text size in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textSize - The text size value
 */
export const setStoreTextSize = (mapId: string, textSize: number): void => {
  getStoreDrawerState(mapId).actions.setTextSize(textSize);
};

/**
 * Sets the text font in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textFont - The font family name
 */
export const setStoreTextFont = (mapId: string, textFont: string): void => {
  getStoreDrawerState(mapId).actions.setTextFont(textFont);
};

/**
 * Sets the text color in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textColor - The text color value
 */
export const setStoreTextColor = (mapId: string, textColor: string): void => {
  getStoreDrawerState(mapId).actions.setTextColor(textColor);
};

/**
 * Sets the text halo color in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textHaloColor - The text halo color value
 */
export const setStoreTextHaloColor = (mapId: string, textHaloColor: string): void => {
  getStoreDrawerState(mapId).actions.setTextHaloColor(textHaloColor);
};

/**
 * Sets the text halo width in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textHaloWidth - The text halo width value
 */
export const setStoreTextHaloWidth = (mapId: string, textHaloWidth: number): void => {
  getStoreDrawerState(mapId).actions.setTextHaloWidth(textHaloWidth);
};

/**
 * Sets the text bold state in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textBold - Whether text should be bold
 */
export const setStoreTextBold = (mapId: string, textBold: boolean): void => {
  getStoreDrawerState(mapId).actions.setTextBold(textBold);
};

/**
 * Sets the text italic state in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textItalic - Whether text should be italic
 */
export const setStoreTextItalic = (mapId: string, textItalic: boolean): void => {
  getStoreDrawerState(mapId).actions.setTextItalic(textItalic);
};

/**
 * Sets the text rotation in the drawer store.
 *
 * @param mapId - The map identifier
 * @param textRotation - The text rotation angle in degrees
 */
export const setStoreTextRotation = (mapId: string, textRotation: number): void => {
  getStoreDrawerState(mapId).actions.setTextRotation(textRotation);
};

/**
 * Sets the draw interaction instance in the drawer store.
 *
 * @param mapId - The map identifier
 * @param drawInstance - The Draw interaction instance
 * @deprecated This function shouldn't exist
 */
export const setStoreDrawInstance = (mapId: string, drawInstance: Draw): void => {
  getStoreDrawerState(mapId).actions.setDrawInstance(drawInstance);
};

/** Removes the draw interaction instance from the drawer store.
 *
 * @param mapId - The map identifier
 * @deprecated This function shouldn't exist
 */
export const removeStoreDrawInstance = (mapId: string): void => {
  getStoreDrawerState(mapId).actions.removeDrawInstance();
};

/**
 * Sets the transform interaction instance in the drawer store.
 *
 * @param mapId - The map identifier
 * @param transformInstance - The Transform interaction instance
 * @deprecated This function shouldn't exist
 */
export const setStoreTransformInstance = (mapId: string, transformInstance: Transform): void => {
  getStoreDrawerState(mapId).actions.setTransformInstance(transformInstance);
};

/** Removes the transform interaction instance from the drawer store.
 *
 * @param mapId - The map identifier
 * @deprecated This function shouldn't exist
 */
export const removeStoreTransformInstance = (mapId: string): void => {
  getStoreDrawerState(mapId).actions.removeTransformInstance();
};

/**
 * Sets the selected drawing feature in the drawer store.
 *
 * @param mapId - The map identifier
 * @param selectedDrawing - The selected feature, or undefined to clear selection
 * @deprecated This function shouldn't exist
 */
export const setStoreSelectedDrawing = (mapId: string, selectedDrawing: Feature | undefined): void => {
  getStoreDrawerState(mapId).actions.setSelectedDrawing(selectedDrawing);
};

/**
 * Sets the snap interaction instance in the drawer store.
 *
 * @param mapId - The map identifier
 * @param snapInstance - The Snap interaction instance
 * @deprecated This function shouldn't exist
 */
export const setStoreSnapInstance = (mapId: string, snapInstance: Snap): void => {
  getStoreDrawerState(mapId).actions.setSnapInstance(snapInstance);
};

/** Removes the snap interaction instance from the drawer store.
 *
 * @param mapId - The map identifier
 * @deprecated This function shouldn't exist
 */
export const removeStoreSnapInstance = (mapId: string): void => {
  getStoreDrawerState(mapId).actions.removeSnapInstance();
};

/**
 * Sets the hide measurements flag in the drawer store.
 *
 * @param mapId - The map identifier
 * @param hideMeasurements - Whether measurements should be hidden
 */
export const setStoreHideMeasurements = (mapId: string, hideMeasurements: boolean): void => {
  getStoreDrawerState(mapId).actions.setHideMeasurements(hideMeasurements);
};

/**
 * Sets the icon source URL in the drawer store.
 *
 * @param mapId - The map identifier
 * @param iconSrc - The icon source URL
 */
export const setStoreDrawerIconSrc = (mapId: string, iconSrc: string): void => {
  getStoreDrawerState(mapId).actions.setIconSrc(iconSrc);
};

/**
 * Sets the undo disabled state in the drawer store.
 *
 * @param mapId - The map identifier
 * @param undoDisabled - Whether undo should be disabled
 */
export const setStoreUndoDisabled = (mapId: string, undoDisabled: boolean): void => {
  getStoreDrawerState(mapId).actions.setUndoDisabled(undoDisabled);
};

/**
 * Sets the redo disabled state in the drawer store.
 *
 * @param mapId - The map identifier
 * @param redoDisabled - Whether redo should be disabled
 */
export const setStoreRedoDisabled = (mapId: string, redoDisabled: boolean): void => {
  getStoreDrawerState(mapId).actions.setRedoDisabled(redoDisabled);
};

/**
 * Updates the style state in the drawer store without triggering feature style refresh.
 *
 * @param mapId - The map identifier
 * @param style - The style properties to set
 */
export const updateStoreStateStyle = (mapId: string, style: StyleProps): void => {
  getStoreDrawerState(mapId).actions.updateStateStyle(style);
};

// #endregion STATE ADAPTORS

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

/** Nav-bar package configuration containing the drawer config. */
type TypeNavBarPackageConfig = {
  /** The drawer plugin configuration, if present. */
  drawer?: TypeDrawerConfig;
};

import { useStore } from 'zustand';

import { useGeoViewStore } from '@/core/stores/stores-managers';
// import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
// import { DrawerEventProcessor } from '@/api/event-processors/event-processor-children/drawer-event-processor';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with DrawerEventProcessor vs DrawerState

// #region INTERFACES & TYPES

type DrawerActions = IDrawerState['actions'];

export interface IDrawerState {
  actions: object;

  setterActions: object;
}

// #endregion INTERFACES & TYPES

/**
 * Initializes a Drawer state object.
 * @param {TypeSetStore} set - The store set callback function
 * @param {TypeSetStore} get - The store get callback function
 * @returns {IDrawerState} - The Drawer state object
 */
// export function initializeDrawerState(set: TypeSetStore, get: TypeGetStore): IDrawerState {
export function initializeDrawerState(): IDrawerState {
  const init = {
    // #region ACTIONS

    actions: {},

    setterActions: {},

    // #endregion ACTIONS
  } as IDrawerState;

  return init;
}

// **********************************************************
// Drawer state selectors
// **********************************************************

export const useDrawerStoreActions = (): DrawerActions => useStore(useGeoViewStore(), (state) => state.drawerState.actions);

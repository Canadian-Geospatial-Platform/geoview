import { create } from 'zustand';

interface GeoViewState {
  mapId: string | undefined;
  //
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
}

export const useGeoViewStore = create<GeoViewState>((set) => ({
  mapId: undefined,
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

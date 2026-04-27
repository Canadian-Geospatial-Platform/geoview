import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useStoreDataTableLayerSettings } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useDataTableController } from '@/core/controllers/use-controllers';

/** Properties for the useColumnVisibility hook. */
export interface UseColumnVisibilityProps {
  layerPath: string;
}

/**
 * Custom hook to manage column visibility state for the data table.
 *
 * Uses a normalization guard in the change handler to prevent the re-render loop
 * caused by MRT calling onColumnVisibilityChange during its own render cycle to
 * register default visibility for columns it has not yet seen.
 *
 * @param props - Hook properties containing the layer path
 * @returns The column visibility state, its setter, and a change handler to pass to MRT
 */
export function useColumnVisibility({ layerPath }: UseColumnVisibilityProps): {
  columnVisibility: Record<string, boolean>;
  setColumnVisibility: Dispatch<SetStateAction<Record<string, boolean>>>;
  onColumnVisibilityChange: (
    updaterOrValue: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
} {
  const datatableSettings = useStoreDataTableLayerSettings();
  const dataTableController = useDataTableController();

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    datatableSettings[layerPath]?.columnVisibilityRecord ?? { geoviewID: false }
  );

  /** Tracks the latest columnVisibility value so the unmount cleanup can persist it without depending on state. */
  const columnVisibilityRef = useRef(columnVisibility);

  /**
   * Handles column visibility changes from MRT.
   *
   * MRT calls this during its render cycle to register default visible state for
   * columns it has not yet seen (normalization). Normalization only ever adds new
   * keys set to true — it never changes existing keys. We detect that case and skip
   * the state update to break the potential re-render loop.
   *
   * @param updaterOrValue - The new visibility record or an updater function
   */
  const onColumnVisibilityChange = (
    updaterOrValue: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ): void => {
    setColumnVisibility((prev) => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      // MRT normalization only adds previously unknown columns as visible (true).
      // If every key in `next` is either new-with-true or unchanged, this is normalization — skip.
      const isNormalization = Object.keys(next).every((key) => (key in prev ? next[key] === prev[key] : next[key] === true));
      const resolved = isNormalization ? prev : next;
      columnVisibilityRef.current = resolved;
      return resolved;
    });
  };

  /**
   * Persists column visibility to the store on unmount only.
   *
   * Writing to Zustand on every visibility change triggers a DataTable re-render,
   * which causes MRT to re-normalize controlled state and fire onColumnVisibilityChange
   * again — creating a loop on repeated Hide All / Show All clicks. Persisting only on
   * unmount is safe because DataTable remounts (keyed by layerPath) on each layer switch.
   */
  useEffect(() => {
    return (): void => {
      dataTableController.setColumnVisibilityRecord(layerPath, columnVisibilityRef.current);
    };
  }, [dataTableController, layerPath]);

  return { columnVisibility, setColumnVisibility, onColumnVisibilityChange };
}

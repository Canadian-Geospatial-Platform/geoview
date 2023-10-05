import type React from 'react';
import { TypeWindow } from 'geoview-core';

interface DataTableProps {
  mapId: string;
}

const w = window as TypeWindow;

/**
 * Create the datatable that displays in footer panel.
 *
 * @returns {JSX.Element} created data table component
 */

export function DataTable({ mapId }: DataTableProps) {
  const { cgpv } = w;
  const { api, react } = cgpv;
  const { useState, useEffect } = react;

  const [table, setTable] = useState(null);

  /**
   * Create data table from geo view layers.
   */
  const createDataTable = async () => {
    const data = await cgpv.api.maps[mapId].dataTable.createDataPanel();
    setTable(data);
  };

  /**
   * get the table after map is loaded and timeout has been passed.
   */
  const getDataTable = () => {
    setTimeout(() => {
      createDataTable();
    }, 1000);
  };

  useEffect(() => {
    api.event.on(api.eventNames.MAP.EVENT_MAP_LOADED, getDataTable, mapId);
    return () => {
      api.event.off(api.eventNames.MAP.EVENT_MAP_LOADED, mapId, getDataTable);
    };
  }, []);

  return <div>{table}</div>;
}

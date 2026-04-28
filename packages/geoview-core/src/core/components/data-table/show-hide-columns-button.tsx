import { useState, useCallback, memo, useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { MRT_TableInstance as MRTTableInstance, MRT_Column as MRTColumn } from 'material-react-table';

import { IconButton, Menu, MenuItem, Switch, Divider, ViewColumnIcon } from '@/ui';
import { logger } from '@/core/utils/logger';
import type { ColumnsType } from './data-table-types';

/** Properties for the ShowHideColumnsButton component. */
interface ShowHideColumnsButtonProps {
  /** The Material React Table instance. */
  table: MRTTableInstance<ColumnsType>;
}

/** Properties for the ColumnMenuItem component. */
interface ColumnMenuItemProps {
  /** The column instance. */
  column: MRTColumn<ColumnsType>;
  /** Whether the column is currently visible. */
  isVisible: boolean;
  /** Callback to toggle column visibility. */
  onToggle: (columnId: string) => void;
}

/**
 * Renders a single column visibility menu item.
 *
 * Memoized to prevent re-rendering all items when only one column's visibility changes.
 *
 * @param props - ColumnMenuItem properties
 * @returns The column menu item element
 */
const ColumnMenuItem = memo(function ColumnMenuItem({ column, isVisible, onToggle }: ColumnMenuItemProps): JSX.Element {
  // #region Handlers

  // Log
  logger.logTraceRender('components/data-table/show-hide-columns-button > ColumnMenuItem');

  /**
   * Handles keyboard events for column toggle menu items.
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onToggle(column.id);
      }
    },
    [column.id, onToggle]
  );

  /**
   * Handles switch change events.
   */
  const handleChange = useCallback((): void => {
    onToggle(column.id);
  }, [column.id, onToggle]);

  // #endregion

  return (
    <MenuItem disableRipple onKeyDown={handleKeyDown} role="menuitemcheckbox" aria-checked={isVisible}>
      <Switch size="small" checked={isVisible} onChange={handleChange} label={column.columnDef.header} />
    </MenuItem>
  );
});

/**
 * Renders a show/hide columns button with a keyboard-navigable menu.
 *
 * @param props - ShowHideColumnsButton properties
 * @returns The show/hide columns button element
 */
export function ShowHideColumnsButton({ table }: ShowHideColumnsButtonProps): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/show-hide-columns-button');

  const { t } = useTranslation();
  const menuId = useId();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // #region Handlers

  /**
   * Opens the column visibility menu.
   */
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
  }, []);

  /**
   * Closes the column visibility menu.
   */
  const handleClose = useCallback((): void => {
    setAnchorEl(null);
  }, []);

  /**
   * Toggles visibility for a specific column.
   */
  const handleToggleColumn = useCallback(
    (columnId: string): void => {
      table.getColumn(columnId)?.toggleVisibility();
    },
    [table]
  );

  /**
   * Shows all columns.
   */
  const handleShowAll = useCallback((): void => {
    table.getAllLeafColumns().forEach((column) => {
      if (column.getCanHide()) {
        column.toggleVisibility(true);
      }
    });
  }, [table]);

  /**
   * Hides all columns (except pinned ones that cannot be hidden).
   */
  const handleHideAll = useCallback((): void => {
    table.getAllLeafColumns().forEach((column) => {
      if (column.getCanHide()) {
        column.toggleVisibility(false);
      }
    });
  }, [table]);

  // #endregion

  /** Columns that can be shown/hidden. */
  const columns = table.getAllLeafColumns().filter((column) => column.columnDef.enableHiding !== false);

  const visibleCount = columns.filter((column) => column.getIsVisible()).length;

  return (
    <>
      <IconButton
        onClick={handleClick}
        aria-controls={open ? menuId : undefined}
        aria-expanded={open ? 'true' : 'false'}
        aria-haspopup="menu"
        tooltip={t('dataTable.showHideColumnsTooltip', { visible: visibleCount, total: columns.length })}
        className="buttonOutline"
        aria-label={t('dataTable.showHideColumns')}
      >
        <ViewColumnIcon />
      </IconButton>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-label': t('dataTable.showHideColumns')!,
          },
        }}
      >
        <MenuItem onClick={handleShowAll} role="menuitem" sx={{ fontWeight: 600 }}>
          {t('dataTable.showAll')}
        </MenuItem>
        <MenuItem onClick={handleHideAll} role="menuitem" sx={{ fontWeight: 600 }}>
          {t('dataTable.hideAll')}
        </MenuItem>
        <Divider />
        {columns.map((column) => (
          <ColumnMenuItem key={column.id} column={column} isVisible={column.getIsVisible()} onToggle={handleToggleColumn} />
        ))}
      </Menu>
    </>
  );
}

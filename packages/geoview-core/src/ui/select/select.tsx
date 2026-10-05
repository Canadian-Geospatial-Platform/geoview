import type { Ref } from 'react';
import { forwardRef, useId, useMemo } from 'react';
import type { InputLabelProps, FormControlProps, SelectProps, SelectChangeEvent, MenuProps, SxProps, Theme } from '@mui/material';
import { FormControl, InputLabel, MenuItem, Select as MaterialSelect } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getSxClasses } from '@/ui/select/select-style';
import { composeSxProps } from '@/ui/style/types';
import { logger } from '@/core/utils/logger';

/** Requires exactly one source for the Select's accessible name. */
type TypeSelectLabelProps = { label: string; 'aria-label'?: never } | { label?: never; 'aria-label': string };

/** Custom MUI Select properties. */
type TypeSelectProps = {
  /** Optional ID of the visible label associated with the select. */
  labelId?: string;
  /** Properties passed to the wrapping form control. */
  formControlProps?: FormControlProps;
  /** ID applied to the underlying select element. */
  id?: string;
  /** Whether the select fills the available width. */
  fullWidth?: boolean;
  /** Current selected value. */
  value: unknown;
  /** Callback invoked when the selected value changes. */
  onChange: (event: SelectChangeEvent<unknown>) => void;
  /** Optional label styling and behaviour; the wrapper owns the label ID. */
  inputLabel?: Omit<InputLabelProps, 'id'> & { id?: never };
  /** Input attributes forwarded to MUI; a defined top-level aria-label takes precedence. */
  inputProps?: SelectProps['inputProps'];
  /** Menu entries displayed by the select. */
  menuItems: TypeMenuItemProps[];
  /** Whether the select is disabled. */
  disabled?: boolean;
  /** Visual variant of the select. */
  variant?: 'standard' | 'outlined' | 'filled';
  /**
   * Props applied to the Menu component.
   * Use this to specify a container element for the menu dropdown.
   * This is particularly important when the Select is inside a fullscreen element,
   * to ensure the menu renders within the fullscreen container.
   * Example: MenuProps={{ container: shellContainer }}
   */
  MenuProps?: Partial<MenuProps>;
  /** Styles applied to the wrapping form control. */
  sx?: SxProps<Theme>;
  /**
   * If true, the selected value is rendered when the value is empty.
   * Used with renderValue to display placeholder-style content.
   */
  displayEmpty?: boolean;
  /**
   * Render function for the selected value display.
   * Allows custom rendering of the selected value in the input.
   */
  renderValue?: (value: unknown) => React.ReactNode;
} & Omit<React.AriaAttributes, 'aria-label'> &
  TypeSelectLabelProps;

/** Properties for a select menu entry. */
export interface TypeMenuItemProps {
  /** Whether this entry is a selectable item or a group header. */
  type?: 'item' | 'header';
  /** Value and display content of the menu entry. */
  item: {
    /** Value emitted when the menu entry is selected. */
    value: string | number;
    /** Content rendered for the menu entry. */
    children: React.ReactNode;
  };
}

/**
 * Custom Material-UI Select component with data-driven menu items.
 *
 * Wraps Material-UI's Select with FormControl and InputLabel for complete form control.
 * Supports menu item grouping (headers and items) and container placement for fullscreen scenarios.
 * Handles both controlled and uncontrolled value modes.
 * Requires a non-empty visible label or aria-label, never both. Visible labels use an
 * automatically generated ID unless labelId is supplied; inputLabel cannot override that ID.
 * Preserves inputProps attributes, overriding only aria-label when supplied at the top level.
 *
 * @param props - Select configuration (see TypeSelectProps interface)
 * @param ref - Reference to underlying FormControl div
 * @returns Select component with form control wrapper
 * @throws {TypeError} When neither or both naming props are supplied, or the accessible name is blank
 *
 * @example
 * ```tsx
 * <Select
 *   value={selected}
 *   onChange={handleChange}
 *   label="Choose option"
 *   menuItems={[{ item: { value: '1', children: 'Option 1' } }]}
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-select/}
 */
function SelectUI(props: TypeSelectProps, ref: Ref<HTMLDivElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/select/select');

  // Get constant from props
  const {
    labelId,
    formControlProps = {},
    id,
    fullWidth = false,
    value,
    onChange,
    label,
    'aria-label': ariaLabel,
    inputLabel,
    inputProps,
    menuItems,
    disabled,
    variant = 'standard',
    MenuProps,
    sx,
    displayEmpty,
    renderValue,
    ...selectProps
  } = props;

  // Hooks
  const generatedLabelId = useId();
  const resolvedLabelId = labelId ?? generatedLabelId;
  const theme = useTheme();

  /**
   * Builds styles for the select component.
   */
  const memoSxClasses = useMemo((): ReturnType<typeof getSxClasses> => {
    logger.logTraceUseMemo('SELECT - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  /**
   * Memoized label component.
   */
  const memoLabelComponent = useMemo((): JSX.Element | null => {
    // Log
    logger.logTraceUseMemo('SELECT - memoLabelComponent', label, resolvedLabelId, memoSxClasses.label, inputLabel);

    return label !== undefined ? (
      <InputLabel sx={memoSxClasses.label} {...inputLabel} id={resolvedLabelId}>
        {label}
      </InputLabel>
    ) : null;
  }, [label, resolvedLabelId, memoSxClasses.label, inputLabel]);

  /**
   * Memoized array of MenuItem components generated from the menuItems prop.
   */
  const memoMenuItemsComponent = useMemo((): JSX.Element[] => {
    // Log
    logger.logTraceUseMemo('SELECT - memoMenuItemsComponent', menuItems, memoSxClasses.menuItem);

    return menuItems.map((menuItem) => (
      <MenuItem key={menuItem.item.value} value={menuItem.item.value} sx={memoSxClasses.menuItem}>
        {menuItem.item.children}
      </MenuItem>
    ));
  }, [menuItems, memoSxClasses.menuItem]);

  /**
   * Memoized FormControl props.
   */
  const memoFormControlProps = useMemo((): Record<string, unknown> => {
    // Log
    logger.logTraceUseMemo('SELECT - memoFormControlProps', fullWidth, variant, formControlProps);

    return {
      fullWidth,
      variant,
      ...formControlProps,
    };
  }, [fullWidth, variant, formControlProps]);

  /**
   * Memoized Select props.
   */
  const memoSelectProps = useMemo((): Record<string, unknown> => {
    // Log
    logger.logTraceUseMemo(
      'SELECT - memoSelectProps',
      label,
      resolvedLabelId,
      ariaLabel,
      id,
      value,
      onChange,
      disabled,
      variant,
      memoSxClasses.formControl,
      MenuProps,
      displayEmpty,
      renderValue,
      inputProps,
      selectProps
    );

    return {
      labelId: label !== undefined ? resolvedLabelId : undefined,
      label,
      id,
      value,
      onChange,
      disabled,
      variant,
      sx: memoSxClasses.formControl,
      ...(MenuProps ? { MenuProps } : {}),
      ...(displayEmpty !== undefined ? { displayEmpty } : {}),
      ...(renderValue ? { renderValue } : {}),
      ...selectProps,
      inputProps: {
        ...inputProps,
        ...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {}),
      },
    };
  }, [
    label,
    resolvedLabelId,
    ariaLabel,
    id,
    value,
    onChange,
    disabled,
    variant,
    memoSxClasses.formControl,
    MenuProps,
    displayEmpty,
    renderValue,
    inputProps,
    selectProps,
  ]);

  /**
   * Composes FormControl and caller sx props without nesting array-form sx.
   */
  const memoMergedSx = useMemo((): SxProps<Theme> | undefined => {
    // Log
    logger.logTraceUseMemo('SELECT - memoMergedSx', formControlProps.sx, sx);

    return composeSxProps(formControlProps.sx, sx);
  }, [formControlProps.sx, sx]);

  const accessibleName = label ?? ariaLabel;
  if ((label !== undefined) === (ariaLabel !== undefined) || typeof accessibleName !== 'string' || !accessibleName.trim()) {
    throw new TypeError('Select requires exactly one non-empty label or aria-label.');
  }

  return (
    <FormControl {...memoFormControlProps} sx={memoMergedSx}>
      {memoLabelComponent}
      <MaterialSelect {...memoSelectProps} ref={ref}>
        {memoMenuItemsComponent}
      </MaterialSelect>
    </FormControl>
  );
}

// Export the Select using forwardRef so that passing ref is permitted and functional in the react standards
export const Select = forwardRef<HTMLDivElement, TypeSelectProps>(SelectUI);

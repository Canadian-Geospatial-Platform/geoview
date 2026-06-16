import type { Ref } from 'react';
import { forwardRef, useMemo } from 'react';
import type { InputLabelProps, FormControlProps, SelectChangeEvent, MenuProps, SxProps, Theme } from '@mui/material';
import { FormControl, InputLabel, MenuItem, Select as MaterialSelect } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getSxClasses } from '@/ui/select/select-style';
import { logger } from '@/core/utils/logger';

/**
 * Custom MUI Select properties
 */
type TypeSelectProps = {
  labelId?: string;
  formControlProps?: FormControlProps;
  id?: string;
  fullWidth?: boolean;
  value: unknown;
  onChange: (event: SelectChangeEvent<unknown>) => void;
  label: string;
  inputLabel: InputLabelProps;
  menuItems: TypeMenuItemProps[];
  disabled?: boolean;
  variant?: 'standard' | 'outlined' | 'filled';
  /**
   * Props applied to the Menu component.
   * Use this to specify a container element for the menu dropdown.
   * This is particularly important when the Select is inside a fullscreen element,
   * to ensure the menu renders within the fullscreen container.
   * Example: MenuProps={{ container: shellContainer }}
   */
  MenuProps?: Partial<MenuProps>;
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
} & React.AriaAttributes;

/**
 * Menu Item properties
 */
export interface TypeMenuItemProps {
  type?: 'item' | 'header';
  item: {
    value: string | number;
    children: React.ReactNode;
  };
}

/**
 * Custom Material-UI Select component with data-driven menu items.
 *
 * Wraps Material-UI's Select with FormControl and InputLabel for complete form control.
 * Supports menu item grouping (headers and items) and container placement for fullscreen scenarios.
 * Handles both controlled and uncontrolled value modes.
 *
 * @param props - Select configuration (see TypeSelectProps interface)
 * @param ref - Reference to underlying FormControl div
 * @returns Select component with form control wrapper
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
    inputLabel,
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
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  /**
   * Memoized label component.
   */
  const memoLabelComponent = useMemo((): JSX.Element | null => {
    // Log
    logger.logTraceUseMemo('ui/select/select - memoLabelComponent', label);

    return label ? (
      <InputLabel id={labelId} sx={sxClasses.label} {...inputLabel}>
        {label}
      </InputLabel>
    ) : null;
  }, [label, labelId, sxClasses.label, inputLabel]);

  /**
   * Memoized array of MenuItem components generated from the menuItems prop.
   */
  const memoMenuItemsComponent = useMemo((): JSX.Element[] => {
    // Log
    logger.logTraceUseMemo('ui/select/select - memoMenuItemsComponent', menuItems);

    return menuItems.map((menuItem) => (
      <MenuItem key={menuItem.item.value} value={menuItem.item.value} sx={sxClasses.menuItem}>
        {menuItem.item.children}
      </MenuItem>
    ));
  }, [menuItems, sxClasses.menuItem]);

  /**
   * Memoized FormControl props.
   */
  const memoFormControlProps = useMemo((): Record<string, unknown> => {
    // Log
    logger.logTraceUseMemo('ui/select/select - memoFormControlProps', formControlProps);

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
    logger.logTraceUseMemo('ui/select/select - memoSelectProps', selectProps);

    return {
      labelId,
      id,
      value,
      onChange,
      disabled,
      variant,
      sx: sxClasses.formControl,
      ...(MenuProps ? { MenuProps } : {}),
      ...(displayEmpty !== undefined ? { displayEmpty } : {}),
      ...(renderValue ? { renderValue } : {}),
      ...selectProps,
    };
  }, [labelId, id, value, onChange, disabled, variant, sxClasses.formControl, MenuProps, displayEmpty, renderValue, selectProps]);

  /**
   * Merge sx with default and custom styles.
   */
  const memoMergedSx = useMemo((): SxProps<Theme> | undefined => {
    // Log
    logger.logTraceUseMemo('ui/select/select - memoMergedSx', sx);

    // Collect all sx sources that exist
    const sources = [formControlProps.sx, sx].filter(Boolean);

    // No sources? Return undefined
    if (sources.length === 0) return undefined;

    // Single source? Return it directly (avoids unnecessary array wrapping)
    if (sources.length === 1) return sources[0];

    // Multiple sources? Flatten to avoid nested arrays (MUI handles array sx)
    return sources.flat() as SxProps<Theme>;
  }, [formControlProps.sx, sx]);

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

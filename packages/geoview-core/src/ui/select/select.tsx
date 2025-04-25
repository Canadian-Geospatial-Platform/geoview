import { Ref, forwardRef, useMemo } from 'react';
import {
  FormControl,
  InputLabel,
  InputLabelProps,
  MenuItem,
  Select as MaterialSelect,
  FormControlProps,
  SelectChangeEvent,
} from '@mui/material';
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
};

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
 * Create a Material UI Select component
 *
 * @param {TypeSelectProps} props custom select properties
 * @returns {JSX.Element} the auto complete ui component
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
    ...selectProps
  } = props;

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const memoLabelComponent = useMemo(
    () =>
      label ? (
        <InputLabel id={labelId} sx={sxClasses.label} {...inputLabel}>
          {label}
        </InputLabel>
      ) : null,
    [label, labelId, sxClasses.label, inputLabel]
  );

  // Memoize menu items rendering
  const memoMenuItemsComponent = useMemo(
    () =>
      menuItems.map((menuItem) => (
        <MenuItem key={menuItem.item.value} value={menuItem.item.value} sx={sxClasses.menuItem}>
          {menuItem.item.children}
        </MenuItem>
      )),
    [menuItems, sxClasses.menuItem]
  );

  // Memoize the FormControl props
  const memoFormControlProps = useMemo(
    () => ({
      fullWidth,
      variant,
      ...formControlProps,
    }),
    [fullWidth, variant, formControlProps]
  );

  // Memoize the MaterialSelect props
  const memoSelectProps = useMemo(
    () => ({
      labelId,
      id,
      value,
      onChange,
      disabled,
      variant,
      sx: sxClasses.formControl,
      ...selectProps,
    }),
    [labelId, id, value, onChange, disabled, variant, sxClasses.formControl, selectProps]
  );

  return (
    <FormControl {...memoFormControlProps}>
      {memoLabelComponent}
      <MaterialSelect {...memoSelectProps} ref={ref}>
        {memoMenuItemsComponent}
      </MaterialSelect>
    </FormControl>
  );
}

// Export the Select using forwardRef so that passing ref is permitted and functional in the react standards
export const Select = forwardRef<HTMLDivElement, TypeSelectProps>(SelectUI);

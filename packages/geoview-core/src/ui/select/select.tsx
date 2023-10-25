/* eslint-disable react/require-default-props */
import {
  FormControl,
  InputLabel,
  InputLabelProps,
  ListSubheader,
  ListSubheaderProps,
  MenuItem,
  MenuItemProps,
  Select as MaterialSelect,
  SelectProps,
  useTheme,
} from '@mui/material';
import { getSxClasses } from './select-style';

/**
 * Custom MUI Select properties
 */
interface TypeSelectProps extends SelectProps {
  mapId?: string;
  fullWidth?: boolean;
  menuItems: TypeMenuItemProps[];
  inputLabel: InputLabelProps;
}

/**
 * Menu Item properties
 */
interface TypeMenuItemProps {
  type?: 'item' | 'header';
  item: MenuItemProps | ListSubheaderProps | null;
}

/**
 * Create a Material UI Select component
 *
 * @param {TypeSelectProps} props custom select properties
 * @returns {JSX.Element} the auto complete ui component
 */
export function Select(props: TypeSelectProps): JSX.Element {
  const { fullWidth, inputLabel, menuItems, ...selectProps } = props;

  const sxtheme = useTheme();
  const classes = getSxClasses(sxtheme);

  return (
    <FormControl fullWidth={fullWidth}>
      <InputLabel sx={classes.label} {...inputLabel}>
        {selectProps.label}
      </InputLabel>
      <MaterialSelect sx={classes.formControl} {...selectProps}>
        {menuItems.map((menuItem: TypeMenuItemProps, index) => {
          if (menuItem) {
            if (menuItem.type === 'header') {
              // eslint-disable-next-line react/no-array-index-key
              return <ListSubheader key={index} {...(menuItem.item as ListSubheaderProps)} />;
            }

            // eslint-disable-next-line react/no-array-index-key
            return <MenuItem key={index} {...(menuItem.item as MenuItemProps)} sx={classes.menuItem} />;
          }

          return null;
        })}
      </MaterialSelect>
    </FormControl>
  );
}

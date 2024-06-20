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
  FormControlProps,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getSxClasses } from './select-style';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

/**
 * Custom MUI Select properties
 */
type TypeSelectProps = SelectProps & {
  fullWidth?: boolean;
  menuItems: TypeMenuItemProps[];
  inputLabel: InputLabelProps;
  formControlProps?: FormControlProps;
};

/**
 * Menu Item properties
 */
export interface TypeMenuItemProps {
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
  const { fullWidth, inputLabel, menuItems, formControlProps = {}, ...selectProps } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const mapId = useGeoViewMapId();
  const mapElem = document.getElementById(`shell-${mapId}`);

  return (
    <FormControl fullWidth={fullWidth} {...formControlProps}>
      {!!selectProps.label && (
        <InputLabel sx={sxClasses.label} {...inputLabel}>
          {selectProps.label}
        </InputLabel>
      )}
      <MaterialSelect sx={sxClasses.formControl} {...selectProps} MenuProps={{ container: mapElem }} >
        {menuItems.map((menuItem: TypeMenuItemProps, index) => {
          if (menuItem) {
            if (menuItem.type === 'header') {
              // eslint-disable-next-line react/no-array-index-key
              return <ListSubheader key={index} {...(menuItem.item as ListSubheaderProps)} />;
            }

            // eslint-disable-next-line react/no-array-index-key
            return <MenuItem key={index} {...(menuItem.item as MenuItemProps)} sx={sxClasses.menuItem} />;
          }

          return null;
        })}
      </MaterialSelect>
    </FormControl>
  );
}

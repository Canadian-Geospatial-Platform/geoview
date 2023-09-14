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
} from '@mui/material';

import makeStyles from '@mui/styles/makeStyles';

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

const useStyles = makeStyles((theme) => ({
  formControl: {
    fontSize: 14,
    width: '100%',
    marginBottom: 16,
    color: theme.palette.text.primary,
    '& .MuiOutlinedInput-notchedOutline': {
      border: `1px solid ${theme.palette.border.primary}`,
      padding: '0 12px 0 8px',
      '&[aria-hidden="true"]': {
        border: `1px solid ${theme.palette.border.primary}`,
      },
    },
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        border: `1px solid ${theme.palette.border.primary}`,
      },
    },
    '& .MuiFormLabel-root.Mui-focused': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.primary.light,
    },
    '& .MuiSelect-select': {
      padding: '16px 12px',
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette.text.primary,
    },
  },
  label: {
    color: theme.palette.text.primary,
    fontSize: 16,
  },
  menuItem: {
    fontSize: 14,
  },
}));
/**
 * Create a Material UI Select component
 *
 * @param {TypeSelectProps} props custom select properties
 * @returns {JSX.Element} the auto complete ui component
 */
export function Select(props: TypeSelectProps): JSX.Element {
  const { fullWidth, inputLabel, menuItems, ...selectProps } = props;
  const classes = useStyles();

  return (
    <FormControl fullWidth={fullWidth}>
      <InputLabel className={classes.label} {...inputLabel}>
        {selectProps.label}
      </InputLabel>
      <MaterialSelect className={classes.formControl} {...selectProps}>
        {menuItems.map((menuItem: TypeMenuItemProps, index) => {
          if (menuItem) {
            if (menuItem.type === 'header') {
              // eslint-disable-next-line react/no-array-index-key
              return <ListSubheader key={index} {...(menuItem.item as ListSubheaderProps)} />;
            }

            // eslint-disable-next-line react/no-array-index-key
            return <MenuItem key={index} {...(menuItem.item as MenuItemProps)} className={classes.menuItem} />;
          }

          return null;
        })}
      </MaterialSelect>
    </FormControl>
  );
}

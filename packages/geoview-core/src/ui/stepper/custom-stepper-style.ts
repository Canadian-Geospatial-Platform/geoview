import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';

type SxStyles = Record<string, SxProps<Theme>>;

/**
 * Get custom sx classes for the MUI custom steper
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  stepperContainer: {
    padding: 15,
    width: 500,
    minWidth: 150,
    border: '0.5px solid grey',
    flexWrap: 'wrap',
    '& .MuiSvgIcon-root.Mui-active': {
      color: '#90caf9',
    },
    '& .MuiSvgIcon-root.Mui-completed': {
      color: '#666666',
    },
  },
  actionContainer: {
    marginTop: 20,
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    '&>*:first-child': {
      width: '100%',
      marginBottom: 8,
    },
    '& > button': {
      width: '30%',
    },
    '& > button > *': {
      textAlign: 'center',
    },
  },
  disabledButton: {
    color: `${theme.palette.geoViewColor?.primary.contrastText}!important`,
  },
});

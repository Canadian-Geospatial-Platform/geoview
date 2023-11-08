import { Theme } from '@mui/material/styles';

// TODO: Refactor Note - No theme when an external component (e.g. GeoChart) uses a CGPV UI component. I had to add the "?" to support when no theme are set (no map).
export const getSxClasses = (theme: Theme) => ({
  formControl: {
    fontSize: 14,
    width: '100%',
    color: theme.palette?.text.primary,
    '& .MuiOutlinedInput-notchedOutline': {
      border: `1px solid ${theme.palette?.border?.primary}`,
      padding: '0 12px 0 8px',
      '&[aria-hidden="true"]': {
        border: `1px solid ${theme.palette?.border?.primary}`,
      },
    },
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        border: `1px solid ${theme.palette?.border?.primary}`,
      },
    },
    '& .MuiFormLabel-root.Mui-focused': {
      color: theme.palette?.primary?.contrastText,
      background: theme.palette?.primary?.light,
    },
    '& .MuiSelect-select': {
      padding: '16px 12px',
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette?.text.primary,
    },
  },
  label: {
    color: theme.palette?.text.primary,
    fontSize: 16,
  },
  menuItem: {
    fontSize: 14,
  },
});

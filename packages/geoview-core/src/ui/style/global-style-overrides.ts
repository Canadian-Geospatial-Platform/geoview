import { IGeoViewColors } from './types';

export const globalStyleOverrides = (geoViewColors: IGeoViewColors) => ({
  '.layer-icon': {
    padding: 3,
    borderRadius: 0,
    border: '1px solid',
    borderColor: geoViewColors.grey.dark[100],
    boxShadow: 2,
    background: geoViewColors.white,
    objectFit: 'scale-down',
    width: '35px',
    height: '35px',
    marginRight: '10px',
  },

  'a[href]': {
    color: geoViewColors.primary.main,
    '*:hover': {
      color: geoViewColors.primary.dark[300],
    },
  },
});

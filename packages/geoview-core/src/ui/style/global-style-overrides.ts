import { IGeoViewColors } from './types';

export const globalStyleOverrides = (geoViewColors: IGeoViewColors) => ({
  /* Scrollbar */
  '*::-webkit-scrollbar': {
    width: '8px',
  },
  '*::-webkit-scrollbar-track': {
    background: geoViewColors.bgColor.darken(0.5, 0.5),
    borderRadius: '5px',
  },
  '*::-webkit-scrollbar-thumb': {
    background: geoViewColors.bgColor.darken(0.5),
    borderRadius: '5px',
  },

  /* Layer Panel */
  '.layer-panel': {
    '&[data-layer-depth="0"], &:not([data-layer-depth])': {
      background: `${geoViewColors.bgColor.light[600]} 0% 0% no-repeat padding-box`,
      borderRadius: '5px',
      marginBottom: '1rem',
    },

    '& .MuiListItemButton-root': {
      backgroundColor: 'transparent !important',
    },

    // for selected layer
    '&.selectedLayer, &.selected': {
      borderColor: geoViewColors.primary.main,
      borderWidth: '2px',
      borderStyle: 'solid',
    },
    // when layer is dragging
    '&.dragging': {
      backgroundcolor: geoViewColors.primary.dark[600],
      cursor: 'grab',
      userSelect: 'none',
    },
    // for handling layer status
    '&.error, &.query-error': {
      background: geoViewColors.error.lighten(0.7, 0.6),
      '& .MuiListItemText-secondary': {
        fontWeight: 'bold',
        color: geoViewColors.error.main,
      },
    },
    // for handling loading layer status
    '&.loading, &.processing, &.query-processing': {
      background: geoViewColors.info.lighten(0.7, 0.6),
      '& .MuiListItemText-secondary': {
        fontWeight: 'bold',
        color: geoViewColors.info.main,
      },
    },
  },
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

  '.bordered': {
    border: `1px solid ${geoViewColors.bgColor.darken(0.5, 0.5)}`,
    boxShadow: `0px 12px 9px -13px ${geoViewColors.bgColor.darken(0.2, 0.5)}`,
  },
  '.bordered-primary': {
    border: `1px solid ${geoViewColors.primary.darken(0.1, 0.9)}`,
    boxShadow: `0px 12px 9px -13px ${geoViewColors.bgColor.dark[200]}`,
  },
});

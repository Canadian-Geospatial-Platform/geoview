import {
  Box,
  Grid,
} from '@/ui';

const sxClasses = {
  expandableGroup: {
    paddingRight: 0,
    paddingLeft: 28,
  },
  expandableIconContainer: {
    paddingLeft: 10,
  },
  legendIcon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    background: '#fff',
  },
  legendIconTransparent: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  maxIconImg: {
    maxWidth: 24,
    maxHeight: 24,
  },
  iconPreview: {
    marginLeft: 8,
    padding: 0,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'palette.grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    '&:focus': {
      border: 'revert',
    },
  },
  stackIconsBox: {
    position: 'relative',
    marginLeft: 8,
    '&:focus': {
      outlineColor: 'grey',
    },
  },
  iconPreviewHoverable: {
    position: 'absolute',
    left: -3,
    top: -2,
    padding: 0,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    transition: 'transform .3s ease-in-out',
    '&:hover': {
      transform: 'rotate(-18deg) translateX(-8px)',
    },
  },
  iconPreviewStacked: {
    // marginLeft: 8,
    padding: 0,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    background: '#fff',
  },
  opacityMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '0 62px 16px 62px',
  },
  menuListIcon: { justifyContent: 'right', 'min-width': '56px' },
};

export interface LayersSelectProps {
  layerNames: undefined;
  layerIds: string[];
}

export function ShowSelectedLayers(props: LayersSelectProps): JSX.Element {
  return (
    <Grid item xs={6}>
          <Box >
            <p>All selected Layers will be displayed here eventually.</p>
          </Box>
        </Grid>
  );
}

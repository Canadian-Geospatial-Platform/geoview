import { Typography } from '@material-ui/core';
import LayersIcon from '@material-ui/icons/Layers';

import { TypeButtonPanelProps } from '../../types/cgpv-types';

/**
 * Create a layers button panel for the appbar
 */
export const LayersPanel: TypeButtonPanelProps = {
    button: {
        id: 'layer-panel',
        tooltip: 'appbar.layers',
        icon: <LayersIcon />,
    },
    panel: {
        title: 'appbar.layers',
        icon: LayersIcon,
        content: (
            <Typography variant="body2" color="textSecondary" component="p">
                This is a place holder panel for the panel components
            </Typography>
        ),
        width: 300,
    },
};

import { Typography } from '@material-ui/core';
import LayersIcon from '@material-ui/icons/Layers';

import { ButtonPanelProps } from '../../common/ui/button-panel';

/**
 * Create a layers button panel for the appbar
 */
export const LayersPanel: ButtonPanelProps = {
    button: {
        tooltip: 'appbar.layers',
        icon: <LayersIcon />,
    },
    panel: {
        title: 'appbar.layers',
        icon: LayersIcon,
        content: (
            <Typography variant="body2" color="textSecondary" component="p">
                This is a place holder panel for the layers componennt
            </Typography>
        ),
        width: 300,
    },
};

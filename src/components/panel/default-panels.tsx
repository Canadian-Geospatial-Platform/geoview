import { Typography } from '@material-ui/core';
import LayersIcon from '@material-ui/icons/Layers';
import { ButtonPanelType } from '../../common/button-panel';

export const LayersPanel: ButtonPanelType = {
    button: {
        tooltip: 'appbar.layers',
        icon: <LayersIcon />,
    },
    panel: {
        title: 'appbar.layers',
        icon: <LayersIcon />,
        content: ((
            <Typography variant="body2" color="textSecondary" component="p">
                This is a place holder panel for the layers componennt
            </Typography>
        ) as unknown) as Element,
        width: 300,
    },
};

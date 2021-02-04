import { Typography } from '@material-ui/core';
import LayersIcon from '@material-ui/icons/Layers';

export const LayersPanel = {
    buttonTooltip: 'appbar.layers',
    buttonIcon: <LayersIcon />,
    status: false,
    panelTitle: 'appbar.layers',
    panelIcon: <LayersIcon />,
    panelContent: ((
        <Typography variant="body2" color="textSecondary" component="p">
            This is a place holder panel for the layers componennt
        </Typography>
    ) as unknown) as Element,
    panelWidth: 'auto',
};

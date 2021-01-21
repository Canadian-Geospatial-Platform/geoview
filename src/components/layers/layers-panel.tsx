import { Typography } from '@material-ui/core';
import LayersIcon from '@material-ui/icons/Layers';

import PanelApp from '../appbar/panel';

type LayerPanelProps = {
    closeDrawer: () => void;
};

export default function LayersPanel(props: LayerPanelProps): JSX.Element {
    const { closeDrawer } = props;

    // TODO: access Leaflat map from custom component to use inside panel event
    // TODO: register and unregister events when panel open and close
    return (
        <PanelApp
            closeDrawer={closeDrawer}
            title={'appbar.layers'}
            icon={<LayersIcon />}
            content={
                ((
                    <Typography variant="body2" color="textSecondary" component="p">
                        This is a place holder panel for the layers componennt
                    </Typography>
                ) as unknown) as Element
            }
        />
    );
}

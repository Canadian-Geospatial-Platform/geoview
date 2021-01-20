import { render } from 'react-dom';

import LayersIcon from '@material-ui/icons/Layers';
import { ThemeProvider } from '@material-ui/core/styles';

import { useMap } from 'react-leaflet';

import LayersPanel from '../../layers/layers-panel';
import ButtonApp from '../button';

import { theme } from '../../../assests/style/theme';

type LayerProps = {
    closeDrawer: () => void;
};

export default function Layers(props: LayerProps): JSX.Element {
    const { closeDrawer } = props;

    const map = useMap();

    function handleclick() {
        render(
            <ThemeProvider theme={theme}>
                <LayersPanel closeDrawer={closeDrawer} />
            </ThemeProvider>,
            map.getContainer().getElementsByClassName('cgp-apppanel')[0]
        );
    }

    return <ButtonApp tooltip="appbar.layers" icon={<LayersIcon />} onClickFunction={handleclick} />;
}

import { render } from 'react-dom';

import LayersIcon from '@material-ui/icons/Layers';

import { useMap } from 'react-leaflet';

import LayersPanel from '../../layers/layers-panel';
import ButtonApp from '../button';

export default function Layers(): JSX.Element {
    const map = useMap();

    function handleclick() {
        render(<LayersPanel />, map.getContainer().getElementsByClassName('cgp-apppanel')[0]);
    }

    return <ButtonApp tooltip="appbar.layers" icon={<LayersIcon />} onClickFunction={handleclick} />;
}

import ZoomOutIcon from '@material-ui/icons/Remove';

import { useMap } from 'react-leaflet';

import { ButtonMapNav } from '../button';

export default function ZoomOut(): JSX.Element {
    // get map to use in zoom function
    const map = useMap();

    function zoomOut() {
        map.zoomOut();
    }

    return <ButtonMapNav tooltip="mapnav.zoomOut" icon={<ZoomOutIcon />} onClickFunction={zoomOut} />;
}

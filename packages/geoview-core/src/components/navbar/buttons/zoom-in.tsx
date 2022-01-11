import ZoomInIcon from '@material-ui/icons/Add';

import { useMap } from 'react-leaflet';

import { ButtonMapNav } from '../button';

export default function ZoomIn(): JSX.Element {
    // get map to use in zoom function
    const map = useMap();

    function zoomIn() {
        map.zoomIn();
    }

    return <ButtonMapNav tooltip="mapnav.zoomIn" icon={<ZoomInIcon />} onClickFunction={zoomIn} />;
}

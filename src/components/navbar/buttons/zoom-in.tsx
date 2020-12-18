import ZoomInIcon from '@material-ui/icons/Add';

import { useMap } from 'react-leaflet';

import { ButtonMapNav, OtherProps } from '../button';

export default function ZoomIn(props: OtherProps): JSX.Element {
    const { ...otherProps } = props;

    // get map to use in zoom function
    const map = useMap();

    function zoomIn() {
        map.zoomIn();
    }

    return <ButtonMapNav tooltip="mapnav.zoomIn" icon={<ZoomInIcon />} onClickFunction={zoomIn} parentClass={otherProps.className} />;
}

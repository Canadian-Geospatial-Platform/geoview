import HomeIcon from '@material-ui/icons/Home';

import { useMap } from 'react-leaflet';

import { ButtonMapNav, OtherProps } from '../button';

export default function Home(props: OtherProps): JSX.Element {
    const { ...otherProps } = props;

    // get map and set initial bounds to use in zoom home
    const map = useMap();
    const initBounds = map.getBounds();

    function setHome() {
        map.fitBounds(initBounds);
    }

    return <ButtonMapNav tooltip="mapnav.home" icon={<HomeIcon />} onClickFunction={setHome} parentClass={otherProps.className} />;
}

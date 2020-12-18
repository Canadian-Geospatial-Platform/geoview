import { useState } from 'react';

import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';

import { useMap } from 'react-leaflet';

import { toggleFullscreen } from '../../../common/map';

import { ButtonMapNav, OtherProps } from '../button';

export default function Fullscreen(props: OtherProps): JSX.Element {
    const { ...otherProps } = props;
    const map = useMap();

    // TODO: need to trap the exit full screen event by ESC to arrange the fs state and icon
    const [fs, setFs] = useState(false);
    function setFullscreen() {
        setFs(!fs);
        toggleFullscreen(map.getContainer());
    }

    return (
        <ButtonMapNav
            tooltip="mapnav.fullscreen"
            icon={!fs ? <FullscreenIcon /> : <FullscreenExitIcon />}
            onClickFunction={setFullscreen}
            parentClass={otherProps.className}
        />
    );
}

import { useCallback, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useMapEvent } from 'react-leaflet';

const deg = String.fromCharCode(176);

function coordFormnat(value: number, card: string): string {
    const d = Math.floor(Math.abs(value)) * (value < 0 ? -1 : 1);
    const m = Math.floor(Math.abs((value - d) * 60));
    const s = Math.round((Math.abs(value) - Math.abs(d) - m / 60) * 3600);
    return `${Math.abs(d)}${deg} ${m >= 10 ? `${m}` : `0${m}`}' ${s >= 10 ? `${s}` : `0${s}`}" ${card}`;
}

export function MousePosition(): JSX.Element {
    const { t } = useTranslation();

    const [position, setPosition] = useState({ lat: '--', lng: '--' });

    const onMouseMove = useCallback(
        (e) => {
            const lat = coordFormnat(e.latlng.lat, e.latlng.lat > 0 ? t('mapctrl.mouseposition.north') : t('mapctrl.mouseposition.south'));
            const lng = coordFormnat(e.latlng.lng, e.latlng.lng < 0 ? t('mapctrl.mouseposition.west') : t('mapctrl.mouseposition.east'));
            setPosition({ lat, lng });
        },
        [t]
    );
    useMapEvent('mousemove', onMouseMove);

    return (
        <span className="leaflet-control-mouseposition">
            {position.lat} | {position.lng}
        </span>
    );
}

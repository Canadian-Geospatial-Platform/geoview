import { useCallback, useMemo, useState } from 'react';

import { Map, CRS, DomEvent } from 'leaflet';
import { MapContainer, TileLayer, useMap, useMapEvent } from 'react-leaflet';
import { useEventHandlers } from '@react-leaflet/core';

import { BasemapOptions } from '../../common/basemap';

import { LEAFLET_POSITION_CLASSES } from '../../common/constant';

function MinimapBounds(props: MiniboundProps) {
    const { parentMap, zoomFactor } = props;
    const minimap = useMap();

    // Clicking a point on the minimap sets the parent's map center
    const onClick = useCallback(
        (e) => {
            parentMap.setView(e.latlng, parentMap.getZoom());
        },
        [parentMap]
    );
    useMapEvent('click', onClick);

    // Keep track of bounds in state to trigger renders
    const [bounds, setBounds] = useState({ height: 0, width: 0, top: 0, left: 0 });

    const onChange = useCallback(() => {
        // Update the minimap's view to match the parent map's center and zoom
        const newZoom = parentMap.getZoom() - zoomFactor > 0 ? parentMap.getZoom() - zoomFactor : 0;
        minimap.flyTo(parentMap.getCenter(), newZoom);

        // Set in timeout the calculation to create the bound so parentMap getBounds has the updated bounds
        setTimeout(() => {
            minimap.invalidateSize();
            const pMin = minimap.latLngToContainerPoint(parentMap.getBounds().getSouthWest());
            const pMax = minimap.latLngToContainerPoint(parentMap.getBounds().getNorthEast());
            setBounds({ height: pMin.y - pMax.y, width: pMax.x - pMin.x, top: pMax.y, left: pMin.x });
        }, 500);
    }, [minimap, parentMap, zoomFactor]);

    // Listen to events on the parent map
    const handlers = useMemo(() => ({ moveend: onChange, zoomend: onChange }), [onChange]);
    useEventHandlers({ instance: parentMap }, handlers);

    return (
        <div
            style={{
                left: `${bounds.left}px`,
                top: `${bounds.top}px`,
                width: `${bounds.width}px`,
                height: `${bounds.height}px`,
                display: 'block',
                opacity: 0.5,
                position: 'absolute',
                border: '1px solid rgb(0, 0, 0)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
            }}
        />
    );
}

export function OverviewMap(props: OverviewProps): JSX.Element {
    const { crs, basemaps, zoomFactor } = props;

    const parentMap = useMap();
    const mapZoom = parentMap.getZoom() - zoomFactor > 0 ? parentMap.getZoom() - zoomFactor : 0;

    // Memorize the minimap so it's not affected by position changes
    const minimap = useMemo(
        () => (
            <MapContainer
                style={{ height: 150, width: 150 }}
                center={parentMap.getCenter()}
                zoom={mapZoom}
                crs={crs}
                dragging={false}
                doubleClickZoom={false}
                scrollWheelZoom={false}
                attributionControl={false}
                zoomControl={false}
                whenCreated={(cgpMap) => {
                    DomEvent.disableClickPropagation(cgpMap.getContainer());
                    DomEvent.disableScrollPropagation(cgpMap.getContainer());
                }}
            >
                {basemaps.map((base: { id: string | number | null | undefined; url: string; }) => (
                    <TileLayer key={base.id} url={base.url} />
                ))}
                <MinimapBounds parentMap={parentMap} zoomFactor={zoomFactor} />
            </MapContainer>
        ),
        [parentMap, crs, mapZoom, basemaps, zoomFactor]
    );

    return (
        <div className={LEAFLET_POSITION_CLASSES.topright}>
            <div className="leaflet-control leaflet-bar">{minimap}</div>
        </div>
    );
}

interface OverviewProps {
    crs: CRS;
    basemaps: BasemapOptions[];
    zoomFactor: number;
}

interface MiniboundProps {
    parentMap: Map;
    zoomFactor: number;
}

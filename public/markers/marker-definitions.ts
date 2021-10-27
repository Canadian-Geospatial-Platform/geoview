import L from 'leaflet';

export const yellowIcon = new L.Icon({
    iconUrl: './markers/marker-icon-yellow.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const yellow2xIcon = new L.Icon({
    iconUrl: './markers/marker-icon-2x-yellow.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const violetIcon = new L.Icon({
    iconUrl: './markers/marker-icon-violet.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const violet2xIcon = new L.Icon({
    iconUrl: './markers/marker-icon-2x-violet.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const orangeIcon = new L.Icon({
    iconUrl: './markers/marker-icon-orange.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const orange2xIcon = new L.Icon({
    iconUrl: './markers/marker-icon-2x-orange.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const greyIcon = new L.Icon({
    iconUrl: './markers/marker-icon-grey.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const grey2xIcon = new L.Icon({
    iconUrl: './markers/marker-icon-2x-grey.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const goldIcon = new L.Icon({
    iconUrl: './markers/marker-icon-gold.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const gold2xIcon = new L.Icon({
    iconUrl: './markers/marker-icon-2x-gold.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const blueIcon = new L.Icon({
    iconUrl: './markers/marker-icon-blue.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const blue2xIcon = new L.Icon({
    iconUrl: './markers/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const blackIcon = new L.Icon({
    iconUrl: './markers/marker-icon-black.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const black2xIcon = new L.Icon({
    iconUrl: './markers/marker-icon-2x-black.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const redIcon = new L.Icon({
    iconUrl: './markers/marker-icon-red.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const red2xIcon = new L.Icon({
    iconUrl: './markers/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const greenIcon = new L.Icon({
    iconUrl: './markers/marker-icon-green.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const redGreenIcon = new L.Icon({
    iconUrl: './markers/marker-icon-red-green.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const greenRedIcon = new L.Icon({
    iconUrl: './markers/marker-icon-green-red.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const green2xIcon = new L.Icon({
    iconUrl: './markers/marker-icon-2x-green.png',
    iconSize: [25, 41],
    iconAnchor: [13, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const getClusterIconFull = (ratio: string): L.DivIcon => {
    const divIcon = L.divIcon({
        className: 'cluster-div-icon',
        html:
            "<div style='transform: rotate(-30deg);'>" +
            "<div class='marker-cluster-full fill'></div>" +
            "<div class='marker-cluster-full hole'></div>" +
            '</div>' +
            "<div class='cluster-div-icon-text'>" +
            `<b class='cluster-text'>${ratio}</b>` +
            '</div>',
        iconSize: [-8, 36],
        iconAnchor: [-4, 36],
    });
    return divIcon;
};

export const getClusterIconPart = (ratio: string): L.DivIcon => {
    const divIcon = L.divIcon({
        className: 'cluster-div-icon',
        html:
            "<div style='transform: rotate(-30deg);'>" +
            "<div class='marker-cluster-part fill'></div>" +
            "<div class='marker-cluster-part hole'></div>" +
            '</div>' +
            "<div class='cluster-div-icon-text'>" +
            `<b class='cluster-text'>${ratio}</b>` +
            '</div>',
        iconSize: [-8, 36],
        iconAnchor: [-4, 36],
    });
    return divIcon;
};

export const getClusterIconEmpty = (ratio: string): L.DivIcon => {
    const divIcon = L.divIcon({
        className: 'cluster-div-icon',
        html:
            "<div style='transform: rotate(-30deg);'>" +
            "<div class='marker-cluster-empty fill'></div>" +
            "<div class='marker-cluster-empty hole'></div>" +
            '</div>' +
            "<div class='cluster-div-icon-text'>" +
            `<b class='cluster-text'>${ratio}</b>` +
            '</div>',
        iconSize: [-8, 36],
        iconAnchor: [-4, 36],
    });
    return divIcon;
};

// function used to create a marker that is not selected
export const unselectedMarkerIconCreator = (): L.DivIcon => {
    const divIcon = L.divIcon({
        className: 'div-icon',
        html:
            "<div style='transform: rotate(-30deg);'>" +
            "<div class='marker-blue fill'></div>" +
            "<div class='marker-blue hole'></div>" +
            '</div>',
        iconSize: [-2, 18],
        iconAnchor: [-1, 18],
    });
    return divIcon;
};

// function used to create a marker that is selected
export const selectedMarkerIconCreator = (): L.DivIcon => {
    const divIcon = L.divIcon({
        className: 'div-icon',
        html:
            "<div style='transform: rotate(-30deg);'>" +
            "<div class='marker-green fill'></div>" +
            "<div class='marker-green hole'></div>" +
            '</div>',
        iconSize: [-2, 18],
        iconAnchor: [-1, 18],
    });
    return divIcon;
};

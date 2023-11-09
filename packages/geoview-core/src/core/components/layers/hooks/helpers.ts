import _ from 'lodash';
import { isVectorLegend, isWmsLegend, isImageStaticLegend, TypeLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { api } from '@/app';
import { TypeLegendLayer, TypeLegendLayerIcon, TypeLegendLayerItem } from '../types';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { generateId } from '@/core/utils/utilities';

export function useLegendHelpers(mapId: string) {
  const store = getGeoViewStore(mapId);

  function populateLegendStoreWithFakeData() {
    const legendInfo = api.maps[mapId].legend.legendLayerSet.resultSets;
    // console.log('I got here ', legendInfo, _.keys(legendInfo));
    const keys = _.keys(legendInfo);

    const layerItems: TypeLegendLayerItem[] = [
      {
        name: 'item 1',
        isChecked: true,
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAAAXNSR0IArs4c6QAAAgpJREFUOE+FlM9rE0EUx9+bXbOa1phtio00xUIr0kPxJAj6LyjoyYNIT4LSYL0Itkn2ZW01B2O8eBFz8ODNk+DFmxevvUpVFKliTMmatPnRbHaebMraNNls5zjz5fNmPu8xCAHLNM15AM5LyQtE9GtYFIMg2YdZUyj2Tekob9jBFBG1/PJDIaZp3oDQzpo4/nOSa4kt2QmvsMOviKjTD/KFGIZxSVXxOY5tzONIGbmlO1yZXXdk6C6l6OOhECJKKArkMbJ5DSM/VBBuYQSuTTVlLfGusd25lcvlrF7QwE1cD8qx8iLqX3VQd/ezjsbSmqnKRqzY7+cAxPOgjH2eAq06UIDbEclbZ8uuHyNtFL0K/4OmaS4gynt7Hv4goPRpBAI3Y10/6eVH530g2fegti4q8fUwKO2AziPI0rlm+v7TsA+EroNqGyL6bRZHSioA+4K4PgHy7/SnzPLjuQFIMpnUxif0KxhqPBP6lziGaqKfwrsngCtnbG6P3slkMi8HIO4GEYWUI/IBHK0sidhGFLBnrhwNpDXjcH0832i0cr1tHujA6urKaYn4RIz+vozR7xrAnmCuTrPcnnwrbWWRiDYD54SIBKhwQQi76Pnh+smuB3TCt1Op1AdEPCDMd+yJSEVVXu36CZfivHPKcT1YlvW6UCg0Dx17L+D5YbSXoKO96PcQ+Jygr2HY2T9D5usSwVan3AAAAABJRU5ErkJggg==',
      },
      {
        name: 'item 2',
        isChecked: true,
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAAAXNSR0IArs4c6QAAAjFJREFUOE+FlDts01AUhu+1E+dtJTyaohAoL1UdIgQIiZcAsTCBBGJgQKhTJVAjyogS4pOrBmVICAtLRQYGxMKExIKKgIEuHTpBC1ODQkElJTRNHNvxvUYuuDRxknqz7/Hnc77/yBj1uQghMd1Aec5gowCw1KsU94Ok02nS0NFNgUMvHNhIAoDSrb4nhBByoyLrmbllOXIk7K0E3XyCM4ynAKB3grpCJEk6gzD3eHqxFvtcVfCQ6KLn94hzLie6kwGY2RICALsRx+Vnvzeuzi41HCpliMcYHdvlbR4N+17hljKWzWarm0G2TkwPX36r4+9Ka6G6RjdqAwJvnI0GVvcHXcVOP20Qy8ObUi1aXtPazsybsF9gF/eJP00/RJKK1hc2Cgkho5QZd00PC78UrDPDFgSHEToQdK/7yWXguA2SSpPXdY2efv5pxSu3WM/kTT/XhkPNqdyk1wa5D+S6Qpn0oVw/OF+RHV0aWX9nZLsbnYoEFh4+SI/YIPF43BUK7bi8rNBHb7/WBn/UNa6znYjfiS4Mia0Br/N2KpV6YoOYDwBA0Bi+t7iqTkyXakFV/z+WX+DRuaifHgp58qoiZzfHbIs4kZjcq3N67mOleWnmW91F/811MuIzDg/4Xnp4NA4A5b57AgBcC6ETGkVFy8/wtr8eRI/jlpRMvscYt0XXde0BwMEYvmL6mV+RB2M7PdT0UK1WnxUKheaWa28VWH6aOpsQBX6q00Pfcfr9Gnqd/QEVbfgSUmthSQAAAABJRU5ErkJggg==',
      },
      {
        name: 'item 3',
        isChecked: false,
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAAAXNSR0IArs4c6QAAAi9JREFUOE+FlE1oE0EUx2dmN5tuNrWNqI3WWhpK1dBaPGjFFgTvFvTkQaQnQWmwHsvG7MuoGNAQPXhQzMGDt54EL56sn+DBgrVSqxVRU5VWQ2myH8nurGQx2mQ36TvOPH4z8/s/BqMmRSkdQMxOM2SPAcBSo1bcDHIpmaREK51mAjdlERIHAN2rvyGEUnqK/7V2RXzzuVPb17NitUmyRex7AGDWgzwhiqKM8AjfCj6eHRA+fsflXVut4kh0xpb85+MALzaEAMBODqG0OPPphPh6kcdGGSGOIG1/RNMHIw/XbPNMKpXKrwe5blLxICz+GJeezYVI4b8CFhRt9fCeVSPSka33UwOpegg+me3ic79rD8AYmdvaWeHo4HLFz0WqZKu3+ddIKR3DFrvgePiwhLFpuYMgGJV6wo4f+drVA24IJB9xBW24bep5gKhG4+Q5glZHh7TJ2zcDHhA4yWklJfByvte/kOMRsz1BRl8nUod2z8vp1F4XJBaL+TtCoVFupXBDejoX5n/mST2lvH0zKh7pL5tbNp1LJBJ3XZDKAgAIvpI56fuyPCFNv2134v1bLNiCisNRy4iE06qhp9bH7Ir4six3Y4av+999PRZ49d6PLOZg1IN9tt7f/cBs8Y0DwLemcwIAhEfoENZK2aofo3eH44G1SmfjSnwaY1wjzHPsAYDnGTte8SMs5MJGtMuqeMjn8/czmYy24dhXG6p+kF6esFrFO/Uemj6n2dfQaO8PHFn0Ek3p9b8AAAAASUVORK5CYII=',
      },
      {
        name: 'item 4',
        isChecked: true,
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAAAXNSR0IArs4c6QAAASZJREFUKFNjZEAC/1cxMH96zOD+jUnbgpPh6ieG/yIHBIrenIEpYYQxbva5m/34zbOWh+m9DBvTV4bf/7kZfvznZhBierybnelCmGAhwwew4vtdphJfGGSuyrOuF0K2CcR++sebQYjl6SHxwgv2YMXnuiKWKrOsiGKE24Oq5ckfXwZp1l0eYOnr3V7XpVm2aaCbCuO/+evEIMx8dAJY8c0e9/uSzDsVcCn++M+cgY3xw2Kw4svdvoflWTbb4FL8+o8TgxDzvhKw4j3tyZWm7EvaGBl/YlX/6Lf/TwW2jfIwLzEd64rZoM2y2hdZw///DAxP/vr+FWJ9kyRZcHwRsv+ZDrUlNIuwvgxkY/in9J+R4c8PBo6rYv9uFImX3TwKshJHYGF3PQBCJWK8tt5Q2wAAAABJRU5ErkJggg==',
      },
      {
        name: 'item 5',
        isChecked: true,
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAAAXNSR0IArs4c6QAAAR1JREFUKFNjZEAFzAw+6e7GHOwWV37++cT79++BN9tmnoEpYYQxAjLKzJj//Fv76edvma9//zNwszIzcLEwMjz5/HP32VdfwxgOLPgAVmyakCUhx8JxdcvL70JoNjG4iXAyPP/y69CZ1VPswYojMkuXrn/yJQpdIYzvIcbJsOPFLw+wYu+Eout73n7XwKXYToiD4dCbHxOgigvv73n7QwGXYmNeVoa3P/8uBisOTC46vO3VdxucJguwMRz6+L0ErDg5u6Jy/aOPbV9xqPYS4/y5/vVfeVjQMcVklW7Y9viLL7oGDzHOv69+/k06vmTiIng4MzAwMCVklza//vYn8N8/BiUGBoY/HKxMV699+lp0c9WMoyBLkRXjcjJcHACUTW/kHNx1hAAAAABJRU5ErkJggg==',
      },
      {
        name: 'item 6',
        isChecked: true,
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAAAXNSR0IArs4c6QAAAgpJREFUOE+FlM9rE0EUx9+bXbOa1phtio00xUIr0kPxJAj6LyjoyYNIT4LSYL0Itkn2ZW01B2O8eBFz8ODNk+DFmxevvUpVFKliTMmatPnRbHaebMraNNls5zjz5fNmPu8xCAHLNM15AM5LyQtE9GtYFIMg2YdZUyj2Tekob9jBFBG1/PJDIaZp3oDQzpo4/nOSa4kt2QmvsMOviKjTD/KFGIZxSVXxOY5tzONIGbmlO1yZXXdk6C6l6OOhECJKKArkMbJ5DSM/VBBuYQSuTTVlLfGusd25lcvlrF7QwE1cD8qx8iLqX3VQd/ezjsbSmqnKRqzY7+cAxPOgjH2eAq06UIDbEclbZ8uuHyNtFL0K/4OmaS4gynt7Hv4goPRpBAI3Y10/6eVH530g2fegti4q8fUwKO2AziPI0rlm+v7TsA+EroNqGyL6bRZHSioA+4K4PgHy7/SnzPLjuQFIMpnUxif0KxhqPBP6lziGaqKfwrsngCtnbG6P3slkMi8HIO4GEYWUI/IBHK0sidhGFLBnrhwNpDXjcH0832i0cr1tHujA6urKaYn4RIz+vozR7xrAnmCuTrPcnnwrbWWRiDYD54SIBKhwQQi76Pnh+smuB3TCt1Op1AdEPCDMd+yJSEVVXu36CZfivHPKcT1YlvW6UCg0Dx17L+D5YbSXoKO96PcQ+Jygr2HY2T9D5usSwVan3AAAAABJRU5ErkJggg==',
      },
    ];
    const legendLayers: TypeLegendLayer[] = [
      {
        layerId: 'testLayerId',
        layerPath: 'testLayerPath',
        layerName: 'TestLayer1',
        type: 'GeoJSON',
        layerStatus: 'loaded',
        layerPhase: 'processed',
        isVisible: true,
        querySent: true,
        children: [],
        items: layerItems,
      },
      {
        layerId: 'geojsonLYR5',
        layerPath: 'geojsonLYR5',
        layerName: 'Layer with groups',
        type: 'GeoJSON',
        layerStatus: 'loaded',
        layerPhase: 'processed',
        isVisible: true,
        querySent: true,
        children: [],
        items: [],
      },
      {
        layerId: 'chrisLayr1',
        layerPath: 'Chris Sample Parent1',
        layerName: 'chrisparentlayer1',
        type: 'GeoJSON',
        layerStatus: 'loaded',
        layerPhase: 'processed',
        isVisible: true,
        querySent: true,
        children: [
          {
            layerId: 'chrisChildLayer1',
            layerPath: 'ChrisSampleC3',
            layerName: 'chrisparentchild1',
            type: 'GeoJSON',
            layerStatus: 'loaded',
            layerPhase: 'processed',
            isVisible: true,
            querySent: true,
            children: [
              {
                layerId: 'chrisGrandChild1',
                layerPath: 'Gran ChildChidl2',
                layerName: 'chris parent child2',
                type: 'GeoJSON',
                layerStatus: 'error',
                layerPhase: 'processed',
                isVisible: false,
                querySent: true,
                children: [],
                items: layerItems,
              },
              {
                layerId: 'chrisGrandChild5',
                layerPath: 'Gran ChildChidl555',
                layerName: 'chris parent child25555',
                type: 'GeoJSON',
                layerStatus: 'loading',
                layerPhase: 'processed',
                isVisible: false,
                querySent: true,
                children: [],
                items: layerItems,
              },
              {
                layerId: 'chrisGrandChild2',
                layerPath: 'Grand Child Chidl3',
                layerName: 'chris parent child3',
                type: 'GeoJSON',
                layerStatus: 'newInstance',
                layerPhase: 'processed',
                isVisible: true,
                querySent: true,
                children: [],
                items: layerItems,
              },
            ],
            items: [],
          },
          {
            layerId: 'chrisChild2',
            layerPath: 'Chris Sample Chidl2',
            layerName: 'chirslyerss',
            type: 'GeoJSON',
            layerStatus: 'loaded',
            layerPhase: 'processed',
            isVisible: false,
            querySent: true,
            children: [],
            items: layerItems,
          },
          {
            layerId: 'chrisChild3',
            layerPath: 'Chris Sample Chidl3',
            layerName: 'chris-child32edd',
            type: 'GeoJSON',
            layerStatus: 'loaded',
            layerPhase: 'processed',
            isVisible: true,
            querySent: true,
            children: [],
            items: layerItems,
          },
        ],
        items: [],
      },
    ];

    keys.forEach((i) => {
      const setData = legendInfo[i];
      const items: TypeLegendLayerItem[] = [];
      const legendData = setData.data?.legend ? (setData.data.legend as TypeLayerStyles) : undefined;
      const itemCanvases = legendData ? legendData.Point?.arrayOfCanvas : undefined;
      if (itemCanvases) {
        itemCanvases.forEach((r, ind) => {
          if (r) {
            items.push({ name: `Item name ${ind}`, isChecked: true, icon: r.toDataURL() });
          }
        });
      }

      const item: TypeLegendLayer = {
        layerId: setData.data?.layerPath ?? `layer${i}`,
        layerPath: setData.data?.layerPath ?? generateId(),
        layerName: setData.data?.layerName?.en ?? 'Uknown Laer name',
        type: setData.data?.type ?? 'imageStatic',
        layerStatus: setData.layerStatus,
        layerPhase: setData.layerPhase,
        querySent: setData.querySent,
        isVisible: true,
        children: [],
        items,
      };

      if (i.startsWith('geojsonLYR5')) {
        legendLayers[1].children.push(item);
      } else {
        legendLayers.push(item);
      }
    });

    // adding to store
    store.setState({
      legendState: { ...store.getState().legendState, legendLayers, selectedLayerPath: legendLayers[0].layerPath },
    });
  }

  function getLayerIconImage(path: string): TypeLegendLayerIcon | undefined {
    const layerLegend = api.maps[mapId].legend.legendLayerSet.resultSets?.[path]?.data;
    let iconDetails: TypeLegendLayerIcon = {};
    if (layerLegend) {
      if (layerLegend.legend === null) iconDetails.iconImg = 'no data';
      if (isWmsLegend(layerLegend) || isImageStaticLegend(layerLegend)) {
        iconDetails.iconType = 'simple';
        if (layerLegend.legend) {
          iconDetails.iconImg = layerLegend.legend?.toDataURL();
        }
      } else if (isVectorLegend(layerLegend) && layerLegend.legend) {
        Object.entries(layerLegend.legend).forEach(([, styleRepresentation]) => {
          if (styleRepresentation.arrayOfCanvas) {
            iconDetails.iconType = 'list';
            const iconImageList = (styleRepresentation.arrayOfCanvas as HTMLCanvasElement[]).map((canvas) => {
              return canvas.toDataURL();
            });
            if (iconImageList.length > 0) iconDetails = { ...iconDetails, iconImg: iconImageList[0] };
            if (iconImageList.length > 1) iconDetails = { ...iconDetails, iconImgStacked: iconImageList[1] };
            if (styleRepresentation.defaultCanvas) {
              iconImageList.push(styleRepresentation.defaultCanvas.toDataURL());
            }
            if (styleRepresentation.clusterCanvas) {
              iconImageList.push(styleRepresentation.clusterCanvas.toDataURL());
            }
            iconDetails.iconList = iconImageList;
          } else {
            iconDetails.iconType = 'simple';
            iconDetails.iconImg = (styleRepresentation.defaultCanvas as HTMLCanvasElement).toDataURL();
          }
        });
      } else {
        // eslint-disable-next-line no-console
        console.log(`${path} - UNHANDLED LEGEND TYPE`);
      }
      return iconDetails;
    }
    return undefined;
  }

  return {
    populateLegendStoreWithFakeData,
    getLayerIconImage,
  };
}

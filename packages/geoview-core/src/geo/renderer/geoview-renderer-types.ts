import { asArray, asString } from 'ol/color';
import { Style, Stroke, Fill, Circle as StyleCircle } from 'ol/style';
import { Options as StrokeOptions } from 'ol/style/Stroke';
import { Options as FillOptions } from 'ol/style/Fill';

import { setAlphaColor } from '../../core/utils/utilities';

const defaultCircleMarkerStyle = new Style({
  image: new StyleCircle({
    radius: 5,
    stroke: new Stroke({
      color: asString(setAlphaColor(asArray('#000000'), 1)),
      width: 1,
    }),
    fill: new Fill({
      color: asString(setAlphaColor(asArray('#000000'), 0.4)),
    }),
  }),
});

const defaultLineStringStyle = new Style({
  stroke: new Stroke({
    color: asString(setAlphaColor(asArray('#000000'), 1)),
    lineCap: 'butt',
    lineJoin: 'bevel',
    lineDash: [30, 10, 5, 2, 2, 5],
    width: 3,
  }),
});

const defaultLinePolygonStyle = new Style({
  stroke: new Stroke({
    // 1 is for opacity
    color: asString(setAlphaColor(asArray('#000000'), 1)),
    lineCap: 'round',
    lineJoin: 'bevel',
    lineDash: [20, 10, 1, 10, 1, 10],
    width: 3,
  }),
  fill: new Fill({
    color: asString(setAlphaColor(asArray('#FF0000'), 0.5)),
  }),
});

const defaultSelectStyle = new Style({
  stroke: new Stroke({
    color: asString(setAlphaColor(asArray('#0000FF'), 1)),
    width: 3,
  }),
  fill: new Fill({
    color: asString(setAlphaColor(asArray('#0000FF'), 0.5)),
  }),
});

const style: Record<string, Style> = {
  Polygon: defaultLinePolygonStyle,
  LineString: defaultLineStringStyle,
  Point: defaultCircleMarkerStyle,
};

export const defaultColor = [
  '#800000',
  '#ff0000',
  '#800080',
  '#ff00ff',
  '#008000',
  '#00ff00',
  '#808000',
  '#ffff00',
  '#000080',
  '#0000ff',
  '#008080',
  '#00ffff',
  '#ffa500',
  '#faebd7',
  '#7fffd4',
  '#ffe4c4',
  '#deb887',
  '#d2691e',
  '#ff7f50',
  '#6495ed',
  '#fff8dc',
  '#dc143c',
  '#b8860b',
  '#a9a9a9',
  '#006400',
  '#bdb76b',
  '#8b008b',
  '#556b2f',
  '#ff8c00',
  '#9932cc',
  '#8b0000',
  '#e9967a',
  '#8fbc8f',
  '#483d8b',
  '#2f4f4f',
  '#00ced1',
  '#9400d3',
  '#ff1493',
  '#00bfff',
  '#696969',
  '#1e90ff',
  '#b22222',
  '#fffaf0',
  '#228b22',
  '#dcdcdc',
  '#ffd700',
  '#adff2f',
  '#ff69b4',
  '#cd5c5c',
  '#4b0082',
  '#f0e68c',
  '#e6e6fa',
  '#7cfc00',
  '#add8e6',
  '#f08080',
  '#e0ffff',
  '#90ee90',
  '#ffb6c1',
  '#20b2aa',
  '#87cefa',
  '#ba55d3',
  '#9370db',
  '#3cb371',
  '#ffdead',
];

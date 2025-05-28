import { Style, Stroke, Fill, Circle } from 'ol/style';
import { DrawEvent } from 'ol/interaction/Draw';

import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
// import { logger } from 'geoview-core/src/core/utils/logger';
import { MapViewer } from 'geoview-core/src/geo/map/map-viewer';
import { TypeWindow } from 'geoview-core/src/core/types/global-types';
import { Draw } from 'geoview-core/src/geo/interaction/draw';
import { sxClasses } from './drawer-style';

type DrawerProps = {
  viewer: MapViewer;
  config: ConfigProps;
};

type ConfigProps = {
  style: {
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  };
  geomTypes: string[];
};

export function DrawPanel(props: DrawerProps): JSX.Element {
  const { viewer, config } = props;

  const { cgpv } = window as TypeWindow;
  // const { useTheme } = cgpv.ui;
  const { useState, useCallback, useMemo, useRef } = cgpv.react;
  const { Box, Button, ButtonGroup, Typography } = cgpv.ui.elements;

  // Get store values
  const displayLanguage = useAppDisplayLanguage();
  // const mapLoaded = useMapLoaded();

  // State
  const [isDrawing, setIsDrawing] = useState(false);
  const [geomType, setGeomType] = useState('Point');
  const [style, setStyle] = useState(config.style);
  const drawRef = useRef<Draw>();

  const startDrawing = useCallback(
    (geomTypeInput: string | undefined = undefined): void => {
      let draw;
      if (geomTypeInput) {
        draw = viewer.initDrawInteractions(`draw-${geomTypeInput}`, geomTypeInput, style);
      } else {
        draw = viewer.initDrawInteractions(`draw-${geomType}`, geomType, style);
      }

      draw.onDrawEnd((_sender: unknown, event: DrawEvent): void => {
        const { feature } = event;

        // Create a style based on your current color settings
        let featureStyle;

        if (geomTypeInput === 'Point' || (!geomTypeInput && geomType === 'Point')) {
          // For points, we need to use a circle style
          featureStyle = new Style({
            image: new Circle({
              radius: style.strokeWidth * 2 || 6,
              fill: new Fill({
                color: style.fillColor,
              }),
              stroke: new Stroke({
                color: style.strokeColor,
                width: style.strokeWidth || 1.3,
              }),
            }),
          });
        } else {
          featureStyle = new Style({
            stroke: new Stroke({
              color: style.strokeColor,
              width: style.strokeWidth || 1.3,
            }),
            fill: new Fill({
              color: style.fillColor,
            }),
          });
        }

        // Apply the style to the feature
        feature.setStyle(featureStyle);
      });

      drawRef.current = draw;
    },
    [geomType, style, viewer]
  );

  const handleToggleDrawing = (): void => {
    if (!drawRef.current) {
      // Not drawing, start
      startDrawing();
      setIsDrawing(true);
    } else {
      // Currently drawing, stop
      drawRef.current.stopInteraction();
      drawRef.current = undefined;
      setIsDrawing(false);
    }
  };

  const handleGeometryTypeChange = useCallback(
    (type: string): void => {
      setGeomType(type);
      if (drawRef.current) {
        drawRef.current.stopInteraction();
        drawRef.current = undefined;
        startDrawing(type);
      }
    },
    [startDrawing]
  );

  const handleClearGeometries = useCallback((): void => {
    config.geomTypes.forEach((type) => {
      const groupKey = `draw-${type}`;
      viewer.layer.geometry.deleteGeometriesFromGroup(groupKey);
    });
  }, [config.geomTypes, viewer.layer.geometry]);

  const buttonArray = useMemo(() => {
    return config.geomTypes.map((type) => {
      return (
        <Button key={`draw-${type}`} variant={geomType === type ? 'contained' : 'outlined'} onClick={() => handleGeometryTypeChange(type)}>
          {type}
        </Button>
      );
    });
  }, [Button, config.geomTypes, geomType, handleGeometryTypeChange]);

  // TODO Add EDIT, SNAPPING, TRANSLATION, SCALING? (See MAP INTERACTIONS region in map-viewer)
  // TO.DO MEASUREMENTS https://openlayers.org/en/latest/examples/measure.html
  // Could use npm package mui-color-input
  return (
    <Box sx={sxClasses.drawer}>
      <ButtonGroup sx={sxClasses.buttonGroup} variant="outlined">
        {buttonArray}
      </ButtonGroup>
      <Box>
        <Typography>Fill Colour</Typography>
        <input
          type="color"
          value={style.fillColor}
          onChange={(e) => {
            setStyle({ ...style, fillColor: e.target.value });
          }}
        />
      </Box>
      <Box>
        <Typography>Stroke Colour</Typography>
        <input
          type="color"
          value={style.strokeColor}
          onChange={(e) => {
            setStyle({ ...style, strokeColor: e.target.value });
          }}
        />
        <Typography>Stroke Width</Typography>
        <input
          type="number"
          value={style.strokeWidth}
          min="0"
          max="10"
          onChange={(e) => {
            const width = parseInt(e.target.value, 10);
            if (!Number.isNaN(width)) {
              setStyle({ ...style, strokeWidth: parseInt(e.target.value, 10) });
            }
          }}
        />
      </Box>
      <Box>
        <Button
          sx={isDrawing ? sxClasses.drawingActive : sxClasses.drawingInactive}
          variant="contained"
          tooltip={
            isDrawing
              ? getLocalizedMessage(displayLanguage, 'drawer.stopDrawingTooltip')
              : getLocalizedMessage(displayLanguage, 'drawer.startDrawingTooltip')
          }
          onClick={handleToggleDrawing}
        >
          {isDrawing
            ? getLocalizedMessage(displayLanguage, 'drawer.stopDrawing')
            : getLocalizedMessage(displayLanguage, 'drawer.startDrawing')}
        </Button>
        <Button tooltip={getLocalizedMessage(displayLanguage, 'drawer.clearTooltip')} variant="outlined" onClick={handleClearGeometries}>
          {getLocalizedMessage(displayLanguage, 'drawer.clear')}
        </Button>
      </Box>
    </Box>
  );
}

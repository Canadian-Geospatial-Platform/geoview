import { TypeWindow } from 'geoview-core';
import { useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions } from 'geoview-core/src/core/stores/store-interface-and-intial-values/drawer-state';
import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';

// import { logger } from 'geoview-core/src/core/utils/logger';

export interface GeometryPickerPanelProps {
  geomTypes: string[];
}

/**
 * Create a geometry picker panel for changing the geometry type for the draw tool
 *
 * @returns {JSX.Element} the created geometry picker panel
 */
export default function GeometryPickerPanel(props: GeometryPickerPanelProps): JSX.Element {
  const { geomTypes } = props;
  const { cgpv } = window as TypeWindow;
  const { useCallback } = cgpv.react;
  const { Button, List, ListItem } = cgpv.ui.elements;
  // const { RadioButtonUncheckedIcon, LinearScaleIcon, PolygonIcon, CircleIcon } = cgpv.ui.elements;

  // Get store values
  const displayLanguage = useAppDisplayLanguage();

  // Store actions
  const { setGeomType } = useDrawerActions();

  /**
   * Handles a click on the draw button
   */
  const handleGeometrySelect = useCallback(
    (geomType: string): void => {
      setGeomType(geomType);
    },
    [setGeomType]
  );

  return (
    <List>
      <ListItem>
        <Button
          id="button-point"
          tooltip={getLocalizedMessage(displayLanguage, 'drawer.point')}
          tooltipPlacement="left"
          size="small"
          onClick={() => handleGeometrySelect('Point')}
        >
          {getLocalizedMessage(displayLanguage, 'drawer.point')}
        </Button>
      </ListItem>
      <ListItem>
        <Button
          id="button-linestring"
          tooltip={getLocalizedMessage(displayLanguage, 'drawer.linestring')}
          tooltipPlacement="left"
          size="small"
          onClick={() => handleGeometrySelect('LineString')}
        >
          {getLocalizedMessage(displayLanguage, 'drawer.linestring')}
        </Button>
      </ListItem>
      <ListItem>
        <Button
          id="button-polygon"
          tooltip={getLocalizedMessage(displayLanguage, 'drawer.polygon')}
          tooltipPlacement="left"
          size="small"
          onClick={() => handleGeometrySelect('Polygon')}
        >
          {getLocalizedMessage(displayLanguage, 'drawer.polygon')}
        </Button>
      </ListItem>
      <ListItem>
        <Button
          id="button-circle"
          tooltip={getLocalizedMessage(displayLanguage, 'drawer.circle')}
          tooltipPlacement="left"
          size="small"
          onClick={() => handleGeometrySelect('Circle')}
        >
          {getLocalizedMessage(displayLanguage, 'drawer.circle')}
        </Button>
      </ListItem>
    </List>
  );
}

import { TypeWindow } from 'geoview-core';
import { useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions } from 'geoview-core/src/core/stores/store-interface-and-intial-values/drawer-state';
import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';

import { IconButton, List, ListItem } from 'geoview-core/src/ui';
// import { logger } from 'geoview-core/src/core/utils/logger';

import { useCallback } from 'react';

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
  const { RadioButtonUncheckedIcon, LinearScaleIcon, PolygonIcon, CircleIcon, QuestionMarkIcon } = cgpv.ui.elements;

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

  const getIconForGeometryType = (geomType: string): React.ReactNode => {
    switch (geomType) {
      case 'Point':
        return <RadioButtonUncheckedIcon />;
      case 'LineString':
        return <LinearScaleIcon />;
      case 'Polygon':
        return <PolygonIcon />;
      case 'Circle':
        return <CircleIcon />;
      default:
        return <QuestionMarkIcon />; // Default icon
    }
  };

  return (
    <List>
      {geomTypes.map((geomType) => (
        <ListItem key={`draw-${geomType}`}>
          <IconButton
            id={`draw-${geomType}`}
            size="small"
            tooltip={getLocalizedMessage(displayLanguage, `drawer.${geomType.toLowerCase()}`)}
            tooltipPlacement="left"
            onClick={() => handleGeometrySelect(geomType)}
          >
            {getIconForGeometryType(geomType)}
          </IconButton>
        </ListItem>
      ))}
    </List>
  );
}

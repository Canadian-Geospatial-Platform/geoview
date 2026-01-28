import { useState } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';

import type { getSxClasses } from '../custom-legend-style';
import type { TypeDescription } from '../custom-legend-types';

interface DescriptionTextProps {
  description: TypeDescription;
  sxClasses: ReturnType<typeof getSxClasses>;
}

/**
 * Renders a collapsible description text component.
 * @param {DescriptionTextProps} props - Component props
 * @returns {JSX.Element} The rendered description
 */
export function DescriptionText({ description, sxClasses }: DescriptionTextProps): JSX.Element {
  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box, Typography, KeyboardArrowDownIcon, KeyboardArrowUpIcon, IconButton, Collapse } = ui.elements;

  const displayLanguage = useAppDisplayLanguage();
  const [expanded, setExpanded] = useState<boolean>(!description.collapsed);

  const handleToggle = (): void => {
    setExpanded(!expanded);
  };

  return (
    <Box>
      <Box sx={sxClasses.descriptionContainer}>
        <IconButton
          size="small"
          onClick={handleToggle}
          aria-label={getLocalizedMessage(displayLanguage, 'CustomLegend.descriptionToggle')}
          sx={sxClasses.descriptionToggleButton}
        >
          {expanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
        </IconButton>
        <Typography sx={sxClasses.descriptionToggleText} onClick={handleToggle}>
          {expanded
            ? getLocalizedMessage(displayLanguage, 'CustomLegend.hideDescription')
            : getLocalizedMessage(displayLanguage, 'CustomLegend.showDescription')}
        </Typography>
      </Box>
      <Collapse in={expanded} sx={sxClasses.descriptionCollapse}>
        <Typography sx={sxClasses.descriptionText}>{description.text}</Typography>
      </Collapse>
    </Box>
  );
}

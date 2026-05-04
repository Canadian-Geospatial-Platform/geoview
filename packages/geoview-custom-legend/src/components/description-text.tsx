import { useState } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { logger } from 'geoview-core/core/utils/logger';

import type { getSxClasses } from '../custom-legend-style';
import type { TypeDescription } from '../custom-legend-types';

/** Props for the DescriptionText component. */
interface DescriptionTextProps {
  description: TypeDescription;
  sxClasses: ReturnType<typeof getSxClasses>;
}

/**
 * Renders a collapsible description text component.
 *
 * @param props - Component props
 * @returns The rendered description
 */
export function DescriptionText({ description, sxClasses }: DescriptionTextProps): JSX.Element {
  logger.logTraceRender('geoview-custom-legend/components/description-text');

  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box, Typography, KeyboardArrowDownIcon, KeyboardArrowUpIcon, IconButton, Collapse } = ui.elements;

  const { t } = useTranslation<string>();
  const [expanded, setExpanded] = useState<boolean>(!description.collapsed);

  /**
   * Handles when the user toggles the description visibility
   */
  const handleToggle = (): void => {
    setExpanded(!expanded);
  };

  return (
    <Box>
      <Box sx={sxClasses.descriptionContainer}>
        <IconButton
          size="small"
          onClick={handleToggle}
          aria-label={t('CustomLegend.descriptionToggle')}
          sx={sxClasses.descriptionToggleButton}
        >
          {expanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
        </IconButton>
        <Typography sx={sxClasses.descriptionToggleText} onClick={handleToggle}>
          {expanded ? t('CustomLegend.hideDescription') : t('CustomLegend.showDescription')}
        </Typography>
      </Box>
      <Collapse in={expanded} sx={sxClasses.descriptionCollapse}>
        <Typography sx={sxClasses.descriptionText}>{description.text}</Typography>
      </Collapse>
    </Box>
  );
}

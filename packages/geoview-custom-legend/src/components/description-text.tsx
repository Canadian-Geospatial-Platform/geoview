import { useState, useId, useCallback } from 'react';

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
 * Uses the custom GeoView Button wrapper with domain-specific props
 * (see @/ui/panel/panel-types.ts TypeButtonProps interface).
 *
 * @param props - Component props
 * @returns The rendered description
 */
export function DescriptionText({ description, sxClasses }: DescriptionTextProps): JSX.Element {
  logger.logTraceRender('geoview-custom-legend/components/description-text');

  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box, Typography, KeyboardArrowDownIcon, KeyboardArrowUpIcon, Button, Collapse } = ui.elements;

  const { t } = useTranslation<string>();
  const [expanded, setExpanded] = useState<boolean>(!description.collapsed);

  // WCAG - Generate unique IDs for ARIA relationships
  const buttonId = useId();
  const regionId = useId();

  // #region Handlers

  /**
   * Handles when the user toggles the description visibility.
   */
  const handleToggle = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation(); // Prevent event from bubbling to parent
    setExpanded((prev) => !prev);
  }, []);

  // #endregion

  return (
    <Box>
      <Button
        id={buttonId}
        type="textWithIcon"
        size="small"
        disableRipple
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls={regionId}
        startIcon={expanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
        sx={sxClasses.descriptionToggleButton}
      >
        {expanded ? t('CustomLegend.hideDescription') : t('CustomLegend.showDescription')}
      </Button>
      <Collapse id={regionId} role="region" aria-labelledby={buttonId} in={expanded} sx={sxClasses.descriptionCollapse}>
        <Typography sx={sxClasses.descriptionText}>{description.text}</Typography>
      </Collapse>
    </Box>
  );
}

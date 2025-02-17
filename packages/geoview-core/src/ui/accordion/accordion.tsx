import { useState, useCallback, ReactNode, CSSProperties, memo } from 'react';

import {
  Box,
  Accordion as MaterialAccordion,
  AccordionSummary as MaterialAccordionSummary,
  AccordionDetails as MaterialAccordionDetails,
} from '@mui/material';
import { ExpandMoreIcon, LoopIcon } from '@/ui';
import { generateId } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the Accordion element
 */
interface AccordionProps {
  id: string;
  sx: CSSProperties;
  items: Array<AccordionItem>;
  className: string;
  defaultExpanded: boolean;
  showLoadingIcon: boolean;
}

interface AccordionState {
  expanded: boolean;
  transition: boolean;
}

export type AccordionItem = {
  title: string;
  content: ReactNode;
};

// Constant style define outside main component
const sxClasses = {
  loadingIcon: {
    animation: 'rotate 1s infinite linear',
    '@keyframes rotate': {
      from: {
        transform: 'rotate(360deg)',
      },
      to: {
        transform: 'rotate(0deg)',
      },
    },
  },
};

// Define AccordionExpandIcon outside of the main component
const AccordionExpandIcon = memo(function AccordionExpandIcon({
  showLoadingIcon,
  isTransitioning,
}: {
  showLoadingIcon: boolean;
  isTransitioning: boolean;
}) {
  if (showLoadingIcon && isTransitioning) {
    return <LoopIcon sx={sxClasses.loadingIcon} />;
  }
  return <ExpandMoreIcon />;
});

/**
 * Create a customized Material UI Fade
 *
 * @param {AccordionProps} props the properties passed to the Fade element
 * @returns {JSX.Element} the created Fade element
 */
export const Accordion = memo(function Accordion(props: AccordionProps): ReactNode {
  logger.logTraceRender('ui/accordions/accordion)');

  // Get const from props
  const { id, sx, items, className, defaultExpanded = false, showLoadingIcon = false } = props;

  // State
  const [accordionStates, setAccordionStates] = useState<AccordionState[]>(
    Array(items.length).fill({ expanded: defaultExpanded, transition: false })
  );

  // Handle accordion expansion/collapse
  const handleAccordionChange = useCallback(
    (index: number) => (event: React.SyntheticEvent, expanded: boolean) => {
      logger.logTraceUseCallback('UI.ACCORDION - change collapse', expanded);

      setAccordionStates((prev) => {
        const updatedStates = [...prev];
        updatedStates[index] = {
          ...updatedStates[index],
          expanded,
        };
        return updatedStates;
      });
    },
    []
  );

  // Handle transition states
  const handleTransitionEnd = useCallback(
    (index: number) => (event: React.TransitionEvent) => {
      logger.logTraceUseCallback('UI.ACCORDION - transition end');

      if (!accordionStates[index].expanded && showLoadingIcon) {
        // Set transition to true when accordion starts closing
        setAccordionStates((prev) => {
          const updatedStates = [...prev];
          updatedStates[index] = {
            ...updatedStates[index],
            transition: true,
          };
          return updatedStates;
        });

        // Reset transition state after height animation completes
        if (event.propertyName === 'height') {
          setAccordionStates((prev) => {
            const updatedStates = [...prev];
            updatedStates[index] = {
              ...updatedStates[index],
              transition: false,
            };
            return updatedStates;
          });
        }
      }
    },
    [accordionStates, showLoadingIcon]
  );

  return (
    <Box id={generateId(id)} sx={sx} className="accordion-group">
      {items.map((item: AccordionItem, index: number) => (
        <MaterialAccordion
          // eslint-disable-next-line react/no-array-index-key
          key={`accordion-${index}`}
          className={className}
          expanded={accordionStates[index].expanded}
          onChange={handleAccordionChange(index)}
          onTransitionEnd={handleTransitionEnd(index)}
        >
          <MaterialAccordionSummary
            expandIcon={<AccordionExpandIcon showLoadingIcon={showLoadingIcon} isTransitioning={accordionStates[index].transition} />}
            aria-controls={`accordion-panel-${index}-a-content`}
          >
            <div>{item.title}</div>
          </MaterialAccordionSummary>
          <MaterialAccordionDetails>{item.content}</MaterialAccordionDetails>
        </MaterialAccordion>
      ))}
    </Box>
  );
});

/**
 * Example of usage
 * <Accordion
      items={Object.values(items).map((item: AccordionItem) => (
          {
              title: writeTitle(item),
              content: writeContent(item)
          }
      ))}
  ></Accordion>
 */

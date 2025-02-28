// GV: THIS UI COMPONENT IS NOT USE
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
export interface AccordionProps {
  /** Unique identifier for the accordion */
  id: string;
  /** Custom styles using CSS properties */
  sx: CSSProperties;
  /** Array of accordion items to display */
  items: Array<AccordionItem>;
  /** Custom class name for styling */
  className: string;
  /** Whether the accordion should be expanded by default */
  defaultExpanded: boolean;
  /** Whether to show a loading icon during transitions */
  showLoadingIcon: boolean;
}

interface AccordionState {
  expanded: boolean;
  transition: boolean;
}

/**
 * Structure for individual accordion items
 */
export type AccordionItem = {
  /** The title text displayed in the accordion header */
  title: string;
  /** The content to be displayed when the accordion section is expanded */
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

/**
 * Internal component for rendering the expand/loading icon
 * @internal
 */
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
 * A customizable accordion component built on Material-UI's Accordion.
 * Provides expandable/collapsible sections with optional loading states and animations.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Accordion
 *   id="my-accordion"
 *   items={[
 *     { title: "Section 1", content: <div>Content 1</div> },
 *     { title: "Section 2", content: <div>Content 2</div> }
 *   ]}
 * />
 *
 * // With loading icon and default expanded
 * <Accordion
 *   id="loading-accordion"
 *   items={items}
 *   showLoadingIcon={true}
 *   defaultExpanded={true}
 *   sx={{ maxWidth: '500px' }}
 * />
 *
 * // With custom styling
 * <Accordion
 *   id="styled-accordion"
 *   items={items}
 *   className="custom-accordion"
 *   sx={{
 *     backgroundColor: '#f5f5f5',
 *     borderRadius: '8px'
 *   }}
 * />
 * ```
 *
 * @param {AccordionProps} props - The properties for the Accordion component
 * @returns {JSX.Element} A rendered accordion component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link AccordionItem} for the structure of individual accordion items
 * @see {@link https://mui.com/material-ui/react-accordion/}
 */
function AccordionUI(props: AccordionProps): ReactNode {
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
}

export const Accordion = AccordionUI;

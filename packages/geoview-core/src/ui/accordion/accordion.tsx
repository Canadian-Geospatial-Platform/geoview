// GV: THIS UI COMPONENT IS NOT USE
import type { ReactNode, CSSProperties } from 'react';
import { useState, useCallback, memo } from 'react';
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
 * Configuration properties for the Accordion component.
 */
export interface AccordionProps {
  /** Unique identifier for the accordion container (auto-generated if omitted) */
  id: string;
  /** MUI theme-compatible styles applied to accordion container */
  sx: CSSProperties;
  /** Array of collapsible sections with title and content */
  items: Array<AccordionItem>;
  /** CSS class applied to each accordion section for custom styling */
  className: string;
  /** Initial expanded state for all accordion sections on mount */
  defaultExpanded: boolean;
  /** Display rotating loading icon during open/close transitions for async operations */
  showLoadingIcon: boolean;
}

interface AccordionState {
  expanded: boolean;
  transition: boolean;
}

/**
 * Single accordion section with title and expandable content.
 */
export type AccordionItem = {
  /** Display text shown in accordion header */
  title: string;
  /** Content rendered when section is expanded (can be any React node) */
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
 * Renders the expand icon with optional loading animation.
 *
 * Displays a loading spinner when transitioning between expand/collapse states,
 * otherwise shows the default expand arrow. This provides visual feedback during
 * asynchronous content loading operations.
 *
 * @param showLoadingIcon - Whether to show loading animation during transitions
 * @param isTransitioning - Whether accordion is currently transitioning
 * @returns Loading spinner icon if both flags are true, otherwise expand arrow icon
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
 * Customizable accordion component with expandable sections and optional loading states.
 *
 * Wraps Material-UI's Accordion to provide collapsible content sections with loading animation
 * support. Manages individual section states internally and renders a loading spinner icon
 * during transitions when showLoadingIcon is enabled. Useful for hierarchical information
 * display and progressive content disclosure.
 *
 * @param props - Accordion configuration (see AccordionProps interface)
 * @returns Rendered accordion with expandable sections
 *
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
 * @see {@link https://mui.com/material-ui/react-accordion/}
 */
function AccordionUI(props: AccordionProps): ReactNode {
  logger.logTraceRenderDetailed('ui/accordions/accordion)');

  // Get const from props
  const { id, sx, items, className, defaultExpanded = false, showLoadingIcon = false } = props;

  // State
  const [accordionStates, setAccordionStates] = useState<AccordionState[]>(
    Array(items.length).fill({ expanded: defaultExpanded, transition: false })
  );

  // #region Handlers

  /**
   * Handles accordion section expand/collapse events
   */
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

  /**
   * Handles height transition animations during expand/collapse
   */
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

  // #endregion

  return (
    <Box id={id || generateId(18)} sx={sx} className="accordion-group">
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

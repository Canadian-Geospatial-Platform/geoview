import { useState, useCallback, ReactNode, CSSProperties } from 'react';

import {
  Box,
  Accordion as MaterialAccordion,
  AccordionSummary as MaterialAccordionSummary,
  AccordionDetails as MaterialAccordionDetails,
} from '@mui/material';
import { ExpandMoreIcon, LoopIcon } from '@/ui';
import { generateId } from '@/core/utils/utilities';

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

export type AccordionItem = {
  title: string;
  content: ReactNode;
};

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
 * Create a customized Material UI Fade
 *
 * @param {AccordionProps} props the properties passed to the Fade element
 * @returns {JSX.Element} the created Fade element
 */
export function Accordion(props: AccordionProps): ReactNode {
  const { id, sx, items, className, defaultExpanded = false, showLoadingIcon = false } = props;

  // internal state
  const [expandedStates, setExpandedStates] = useState<boolean[]>(Array(items.length).fill(defaultExpanded));
  const [transitionStates, setTransitionStates] = useState<boolean[]>(Array(items.length).fill(false));

  const handleAccordionChange = (index: number) => (event: React.SyntheticEvent, expanded: boolean) => {
    const updatedStates = [...expandedStates];
    updatedStates[index] = expanded;
    setExpandedStates(updatedStates);
  };

  const handleTransitionEnd = useCallback(
    (index: number) => (e: React.TransitionEvent) => {
      if (!expandedStates[index] && showLoadingIcon) {
        const updatedStates = [...transitionStates];
        updatedStates[index] = true;
        setTransitionStates(updatedStates);

        if (e.propertyName === 'height') {
          const resetStates = [...transitionStates];
          resetStates[index] = false;
          setTransitionStates(resetStates);
        }
      }
    },
    [expandedStates, showLoadingIcon, transitionStates]
  );

  return (
    <Box id={generateId(id)} sx={sx} className="accordion-group">
      {items.map((item: AccordionItem, idx: number) => (
        <MaterialAccordion
          // eslint-disable-next-line react/no-array-index-key
          key={idx}
          className={className}
          expanded={expandedStates[idx]}
          onChange={handleAccordionChange(idx)}
          onTransitionEnd={handleTransitionEnd(idx)}
        >
          <MaterialAccordionSummary
            expandIcon={showLoadingIcon && transitionStates[idx] ? <LoopIcon sx={sxClasses.loadingIcon} /> : <ExpandMoreIcon />}
            aria-controls={`accordion-panel-${idx}-a-content`}
          >
            <div>{item.title}</div>
          </MaterialAccordionSummary>
          <MaterialAccordionDetails>{item.content}</MaterialAccordionDetails>
        </MaterialAccordion>
      ))}
    </Box>
  );
}

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

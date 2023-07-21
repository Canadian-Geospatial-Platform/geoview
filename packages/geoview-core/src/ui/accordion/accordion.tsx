import { useState, useCallback } from 'react';
import {
  Accordion as MaterialAccordion,
  AccordionSummary as MaterialAccordionSummary,
  AccordionDetails as MaterialAccordionDetails,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Loop as LoopIcon } from '@mui/icons-material';
import { generateId } from '@/core/utils/utilities';

/**
 * Properties for the Accordion element
 */
interface AccordionProps {
  id: string;
  items: Array<AccordionItem>;
  className: string;
  defaultExpanded: boolean;
  showLoadingIcon: boolean;
}

export type AccordionItem = {
  title: string;
  content: React.ReactNode | Element;
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
export function Accordion(props: AccordionProps): JSX.Element {
  const { id, items, className, defaultExpanded = false, showLoadingIcon = false } = props;

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isTransitionStarted, setIsTransitionStarted] = useState<boolean>(false);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (!isExpanded && showLoadingIcon) {
        setIsTransitionStarted(true);
        if (e.propertyName === 'height') {
          setIsTransitionStarted(false);
        }
      }
    },
    [isExpanded, showLoadingIcon]
  );

  return (
    <div id={generateId(id)} className="accordion-group">
      {Object.values(items).map((item: AccordionItem, idx: number) => (
        /* eslint-disable react/no-array-index-key */
        <MaterialAccordion
          key={idx}
          className={className}
          defaultExpanded={defaultExpanded}
          onChange={(_, expanded) => setIsExpanded(expanded)}
          onTransitionEnd={handleTransitionEnd}
          expanded={isExpanded}
        >
          <MaterialAccordionSummary
            expandIcon={showLoadingIcon && isTransitionStarted ? <LoopIcon sx={sxClasses.loadingIcon} /> : <ExpandMoreIcon />}
            aria-controls={`accordion-panel-${idx}-a-content`}
          >
            <div>{item.title}</div>
          </MaterialAccordionSummary>
          <MaterialAccordionDetails>{item.content}</MaterialAccordionDetails>
        </MaterialAccordion>
      ))}
    </div>
  );
}

/**
 * Example of usage
 * <Accordion
      className="accordion-theme"
      items={Object.values(items).map((item: AccordionItem) => (
          {
              title: writeTitle(item),
              content: writeContent(item)
          }
      ))}
  ></Accordion>
 */

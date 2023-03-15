import {
  Accordion as MaterialAccordion,
  AccordionSummary as MaterialAccordionSummary,
  AccordionDetails as MaterialAccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { generateId } from '../../core/utils/utilities';

/**
 * Properties for the Accordion element
 */
interface AccordionProps {
  id: string;
  items: Array<AccordionItem>;
  className: string;
}

export type AccordionItem = {
  title: string;
  content: React.ReactNode | Element;
};

/**
 * Create a customized Material UI Fade
 *
 * @param {AccordionProps} props the properties passed to the Fade element
 * @returns {JSX.Element} the created Fade element
 */
export function Accordion(props: AccordionProps): JSX.Element {
  const { id, items, className } = props;

  return (
    <div id={generateId(id)} className="accordion-group">
      {Object.values(items).map((item: AccordionItem, idx: number) => (
        // eslint-disable-next-line react/no-array-index-key
        <MaterialAccordion key={idx} className={className}>
          <MaterialAccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`accordion-panel-${idx}-a-content`}>
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

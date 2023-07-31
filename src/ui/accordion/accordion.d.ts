import { ReactNode } from 'react';
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
    content: ReactNode;
};
/**
 * Create a customized Material UI Fade
 *
 * @param {AccordionProps} props the properties passed to the Fade element
 * @returns {JSX.Element} the created Fade element
 */
export declare function Accordion(props: AccordionProps): ReactNode;
export {};
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

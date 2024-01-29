/// <reference types="react" />
import { TypeTabs } from '@/ui';
type FooterTabsProps = {
    onSelectedTabChanged?: (tab: TypeTabs) => void;
};
/**
 * The FooterTabs component is used to display a list of tabs and their content.
 *
 * @returns {JSX.Element} returns the Footer Tabs component
 */
export declare function FooterTabs(props: FooterTabsProps): JSX.Element | null;
export declare namespace FooterTabs {
    var defaultProps: {
        onSelectedTabChanged: undefined;
    };
}
export {};

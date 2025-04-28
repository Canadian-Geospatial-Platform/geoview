import { TypeLegendLayer } from '@/core/components/layers/types';
interface LegendContainerProps {
    layers: TypeLegendLayer[];
}
/**
 * LegendContainer component to display a list of layers and their items.
 */
declare function LegendContainerComponent({ layers }: LegendContainerProps): JSX.Element;
declare namespace LegendContainerComponent {
    var displayName: string;
}
export declare const LegendContainer: import("react").MemoExoticComponent<typeof LegendContainerComponent>;
export {};

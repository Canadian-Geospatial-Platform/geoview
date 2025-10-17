import type { ReactNode } from 'react';
import type { CardProps } from '@mui/material';
type HeadingElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
/**
 * Properties for the Card component extending Material-UI's CardProps
 */
export interface CardPropsExtend extends CardProps {
    title?: string;
    contentCard?: ReactNode;
    headerComponent?: HeadingElement;
}
/**
 * A customized Material UI Card component with header and content sections.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Card
 *   title="Card Title"
 *   contentCard={<p>Card content goes here</p>}
 * />
 *
 * // With custom heading level
 * <Card
 *   title="Important Section"
 *   headerComponent="h2"
 *   contentCard={<div>Important content</div>}
 * />
 *
 * // With custom styling
 * <Card
 *   title="Styled Card"
 *   sx={{
 *     maxWidth: 345,
 *     margin: 2
 *   }}
 *   contentCard={<Typography>Custom styled card content</Typography>}
 * />
 * ```
 *
 * @param {CardPropsExtend} props - The properties for the Card component
 * @returns {JSX.Element} A rendered Card component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/react-card/}
 */
declare function CardUI(props: CardPropsExtend): JSX.Element;
export declare const Card: typeof CardUI;
export {};
//# sourceMappingURL=card.d.ts.map
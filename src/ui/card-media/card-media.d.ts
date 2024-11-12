import { CardMediaProps } from '@mui/material';
/**
 * Properties for the Card Media
 */
interface TypeCardMediaProps extends CardMediaProps {
    alt: string;
    click?(): void;
    keyDown?(e: unknown): void;
}
/**
 * Create a customized Material UI Card Media
 *
 * @param {TypeCardMediaProps} props the properties passed to the Card Media element
 * @returns {JSX.Element} the created Card Media element
 */
export declare function CardMedia(props: TypeCardMediaProps): JSX.Element;
export {};

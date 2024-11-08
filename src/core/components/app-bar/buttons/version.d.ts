/**
 * An object containing version information.
 *
 * @export
 * @interface TypeAppVersion
 */
export type TypeAppVersion = {
    hash: string;
    major: number;
    minor: number;
    patch: number;
    timestamp: string;
};
export default function Version(): JSX.Element;

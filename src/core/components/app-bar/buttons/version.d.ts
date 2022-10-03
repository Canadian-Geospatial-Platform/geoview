/// <reference types="react" />
/**
 * An object containing version information.
 *
 * @export
 * @interface TypeAppVersion
 */
export declare type TypeAppVersion = {
    hash: string;
    major: number;
    minor: number;
    patch: number;
    timestamp: string;
};
interface VersionProps {
    drawerStatus: boolean;
}
export default function Version(props: VersionProps): JSX.Element;
export {};

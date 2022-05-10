/// <reference types="react" />
import { TypeMapConfigProps } from '../types/cgpv-types';
/**
 * Interface for the shell properties
 */
interface ShellProps {
    id: string;
    config: TypeMapConfigProps;
}
/**
 * Create a shell component to wrap the map and other components not inside the map
 * @param {ShellProps} props the shell properties
 * @returns {JSX.Element} the shell component
 */
export declare function Shell(props: ShellProps): JSX.Element;
export {};

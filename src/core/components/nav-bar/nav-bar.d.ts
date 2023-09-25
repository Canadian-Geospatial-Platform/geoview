import { Dispatch, SetStateAction } from 'react';
type NavbarProps = {
    activeTrap: boolean;
    activeTrapSet: Dispatch<SetStateAction<boolean>>;
};
/**
 * Create a nav-bar with buttons that can call functions or open custom panels
 */
export declare function Navbar({ activeTrap, activeTrapSet }: NavbarProps): JSX.Element;
export {};

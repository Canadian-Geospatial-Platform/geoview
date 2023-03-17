import { Dispatch, SetStateAction } from 'react';
type NavbarProps = {
    setActivetrap: Dispatch<SetStateAction<boolean>>;
};
/**
 * Create a nav-bar with buttons that can call functions or open custom panels
 */
export declare function Navbar({ setActivetrap }: NavbarProps): JSX.Element;
export {};

import { SetStateAction, Dispatch } from 'react';
type AppbarProps = {
    setActivetrap: Dispatch<SetStateAction<boolean>>;
};
/**
 * Create an app-bar with buttons that can open a panel
 */
export declare function Appbar({ setActivetrap }: AppbarProps): JSX.Element;
export {};

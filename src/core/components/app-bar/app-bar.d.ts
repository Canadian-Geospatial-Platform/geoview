import { SetStateAction, Dispatch } from 'react';
type AppbarProps = {
    activeTrap: boolean;
    activeTrapSet: Dispatch<SetStateAction<boolean>>;
};
/**
 * Create an app-bar with buttons that can open a panel
 */
export declare function Appbar({ activeTrap, activeTrapSet }: AppbarProps): JSX.Element;
export {};

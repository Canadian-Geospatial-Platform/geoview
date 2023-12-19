/// <reference types="react" />
import { TypeButtonPanel, TypeIconButtonProps, TypePanelProps } from '@/core/types/cgpv-types';
import { AbstractPlugin } from './abstract-plugin';
/** ******************************************************************************************************************************
 * AppBar Plugin abstract class.
 */
export declare abstract class AppBarPlugin extends AbstractPlugin {
    buttonPanel?: TypeButtonPanel;
    buttonProps?: TypeIconButtonProps;
    panelProps?: TypePanelProps;
    /**
     * Overridable function to create app bar button props content
     * @returns TypeIconButtonProps The app bar button props content
     */
    onCreateButtonProps(): TypeIconButtonProps;
    /**
     * Overridable function to create app bar props content
     * @returns TypePanelProps The app bar props content
     */
    onCreateContentProps(): TypePanelProps;
    /**
     * Overridable function to create app bar actual content
     * @returns JSX.Element The app bar actual content
     */
    onCreateContent(): JSX.Element;
    /**
     * Called when an app bar plugin is being added
     */
    onAdd(): void;
    /**
     * Called when an app bar plugin is being removed
     */
    onRemove(): void;
}

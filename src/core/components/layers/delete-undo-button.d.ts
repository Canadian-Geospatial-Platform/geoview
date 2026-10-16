/** Props for the DeleteUndoButton component. */
interface DeleteUndoButtonProps {
    /** Path of the layer to delete or restore. */
    layerPath: string;
    /** Whether the layer permits removal. */
    layerRemovable: boolean;
    /** Optional map-scoped element ID to focus after deletion completes. */
    focusTargetIdAfterDelete?: string;
}
/**
 * Creates the layer delete button with a temporary undo action and keyboard focus restoration.
 *
 * @param props - Properties defined in DeleteUndoButtonProps interface
 * @returns The delete or undo button for the layer
 */
export declare function DeleteUndoButton(props: DeleteUndoButtonProps): JSX.Element;
export {};
//# sourceMappingURL=delete-undo-button.d.ts.map
/// <reference types="react" />
import { ModalModel } from './modal-model';
/**
 * Both header and footer actions' properties interface
 */
export interface ModalActionsType {
    actionId: string;
    content?: React.ReactNode;
}
/**
 * Modal header properties interface
 */
export interface modalHeader {
    title: string | undefined;
    actions?: Array<ModalActionsType>;
}
/**
 * Modal footer properties interface
 */
export interface modalFooter {
    actions?: Array<ModalActionsType>;
}
/**
 * Properties definition of the modal
 */
export declare type TypeModalProps = {
    modalId?: string;
    header?: modalHeader;
    content: React.ReactNode | string;
    footer?: modalFooter;
    active?: boolean;
    open?: () => void;
    close?: () => void;
    mapId?: string;
    width?: string | number;
    height?: string | number;
};
/**
 * Class used to handle creating a new modal
 *
 * @exports
 * @class ModalApi
 */
export declare class ModalApi {
    mapId: string;
    modals: Record<string, ModalModel>;
    /**
     * constructor to initiate the map id
     *
     * @param { string } mapId the id of the map where the modal is to be generated
     */
    constructor(mapId: string);
    /**
     * Function that creates the modal
     *
     * @param { TypeModalProps } modal the modal object of type TypeModalProps
     */
    createModal: (modal: TypeModalProps) => void;
    /**
     * Function that deletes the modal by the id specified
     *
     * @param { string } id of the modal that is to be deleted
     */
    deleteModal: (modalId: string) => void;
}

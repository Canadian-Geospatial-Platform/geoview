import { ModalModel } from './modal-model';

import { generateId } from '@/core/utils/utilities';

import { api } from '../../app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { modalPayload } from '@/api/events/payloads/modal-payload';

/**
 * Both header and footer actions' properties interface
 */
export interface ModalActionsType {
  // the id of the action (button)
  actionId: string;

  // content is the action itself, HTML (in the form of a string) or JSX
  content?: React.ReactNode;
}

/**
 * Modal header properties interface
 */
export interface modalHeader {
  // the heading (title) of modal. MUI places heading inside <h2> element
  title: string | undefined;

  // for the action buttons like close, back etc. Must be an array of objects with 'id' and 'content'
  actions?: Array<ModalActionsType>;
}

/**
 * Modal footer properties interface
 */
export interface modalFooter {
  // the action buttons in footer of the modal. Must be an array
  actions?: Array<ModalActionsType>;
}

/**
 * Properties definition of the modal
 */
export type TypeModalProps = {
  // id of the modal. Must be unique. If not provided, it will be generated
  modalId?: string;

  // header of modal. Contains heading (title) of modal and/or action buttons, if provided. If header is not provided, modal will have no header content
  header?: modalHeader;

  // content (description) of the modal. The HTML passed will be displayed inside a <div> element
  content: React.ReactNode | string;

  // footer object for the modal. Can contain buttons list as an array of JSX elements. If none provided, there will be no action buttons or footer
  footer?: modalFooter;

  // boolean condition to check if modal is active (open) or not
  active?: boolean;

  // function that opens a modal
  open?: () => void;

  // function that closes a modal
  close?: () => void;

  // the id of map whose modal is generated
  mapId?: string;

  // width of the modal
  width?: string | number;

  // height of the modal
  height?: string | number;
};

/**
 * Class used to handle creating a new modal
 *
 * @exports
 * @class ModalApi
 */
export class ModalApi {
  mapId: string;

  modals: Record<string, ModalModel> = {};

  /**
   * constructor to initiate the map id
   *
   * @param { string } mapId the id of the map where the modal is to be generated
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Function that creates the modal
   *
   * @param { TypeModalProps } modal the modal object of type TypeModalProps
   */
  createModal = (modal: TypeModalProps): void => {
    if (!modal.content) return;
    const modalId = modal.modalId ? modal.modalId : generateId('');
    this.modals[modalId] = new ModalModel(modal.content);
    this.modals[modalId].modalModelId = modalId;
    this.modals[modalId].mapId = this.mapId;
    this.modals[modalId].header = modal.header || this.modals[modalId].header;
    this.modals[modalId].content = modal.content;
    this.modals[modalId].footer = modal.footer || this.modals[modalId].footer;
    this.modals[modalId].width = modal.width || this.modals[modalId].width;
    this.modals[modalId].height = modal.height || this.modals[modalId].height;

    api.event.emit(modalPayload(EVENT_NAMES.MODAL.EVENT_MODAL_CREATE, this.mapId, modalId));
  };

  /**
   * Function that deletes the modal by the id specified
   *
   * @param { string } id of the modal that is to be deleted
   */
  deleteModal = (modalId: string): void => {
    if (!Object.keys(this.modals)) return;
    delete this.modals[modalId];
  };
}

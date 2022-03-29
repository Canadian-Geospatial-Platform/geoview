import { ModalModel } from "./modal-model";
import { TypeFunction, TypeChildren } from "../../core/types/cgpv-types";
import { generateId } from "../../core/utils/utilities";

import { api } from "../../api/api";
import { EVENT_NAMES } from "../../api/event";

/**
 * Both header and footer actions' properties interface
 */
export interface ModalActionsType {
  // the id of the action (button)
  id: string;

  // content is the action itself, HTML (in the form of a string) or JSX
  content?: TypeChildren;
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
  id?: string;

  // header of modal. Contains heading (title) of modal and/or action buttons, if provided. If header is not provided, modal will have no header content
  header?: modalHeader;

  // content (description) of the modal. The HTML passed will be displayed inside a <div> element
  content: string;

  // footer object for the modal. Can contain buttons list as an array of JSX elements. If none provided, there will be no action buttons or footer
  footer?: modalFooter;

  // boolean condition to check if modal is active (open) or not
  active?: boolean;

  // function that opens a modal
  open?: TypeFunction;

  // function that closes a modal
  close?: TypeFunction;

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
 * @export
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
    const id = modal.id ? modal.id : generateId("");
    this.modals[id] = new ModalModel(modal.content);
    this.modals[id].id = id;
    this.modals[id].mapId = this.mapId;
    this.modals[id].header = modal.header || this.modals[id].header;
    this.modals[id].content = modal.content;
    this.modals[id].footer = modal.footer || this.modals[id].footer;
    this.modals[id].width = modal.width || this.modals[id].width;
    this.modals[id].height = modal.height || this.modals[id].height;

    api.event.emit(EVENT_NAMES.EVENT_MODAL_CREATE, this.mapId, {
      id,
    });
  };

  /**
   * Function that deletes the modal by the id specified
   *
   * @param { string } id of the modal that is to be deleted
   */
  deleteModal = (id: string): void => {
    if (!Object.keys(this.modals)) return;
    delete this.modals[id];
  };
}

import { TypeFunction, TypeChildren } from '../../core/types/cgpv-types';
import { generateId } from '../../core/utils/utilities';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

/**
 * Both header and footer actions' properties interface
 */
interface ActionsType {
  // the id of the action (button)
  id: string;

  // content is the action itself, HTML (in the form of a string) or JSX
  content?: TypeChildren;
}

/**
 * Modal header properties interface
 */
interface modalHeader {
  // the heading (title) of modal. MUI places heading inside <h2> element
  title: string | undefined;

  // for the action buttons like close, back etc. Must be an array of objects with 'id' and 'content'
  actions?: Array<ActionsType>;
}

/**
 * Modal footer properties interface
 */
interface modalFooter {
  // the action buttons in footer of the modal. Must be an array
  actions?: Array<ActionsType>;
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
 * Class used to create a template (model) of a modal
 *
 * @class ModalModel
 */
class ModalModel {
  id?: string;

  header?: modalHeader;

  content: string;

  footer?: modalFooter;

  active?: boolean;

  mapId?: string;

  width?: string | number;

  height?: string | number;

  /**
   * constructor to initiate the modal properties
   *
   * @param { string } content is the body copy (description) of the modal
   */
  constructor(content: string) {
    this.content = content;
  }

  /**
   * Trigger an event to open the modal
   */
  open = (): void => {
    this.active = true;

    api.event.emit(EVENT_NAMES.EVENT_MODAL_OPEN, this.mapId, {
      id: this.id,
      open: true,
    });
  };

  /**
   * Trigger an event to close the modal
   */
  close = (): void => {
    this.active = false;

    api.event.emit(EVENT_NAMES.EVENT_MODAL_CLOSE, this.mapId, {
      id: this.id,
      open: false,
    });
  };

  /**
   * Function to update the content of currently existing modal. Only the
   * passed properties will replace the old ones
   *
   * @param { TypeModalProps } modal must be an object with the above defined (TypeModalProps) properties
   */
  update = (modal: TypeModalProps): void => {
    this.id = modal.id || this.id;

    if (this.header) {
      if (this.header.title) this.header.title = modal.header?.title || this.header.title;
      if (this.header.actions) this.header.actions = modal.header?.actions || this.header?.actions;
    }
    this.content = modal.content || this.content;
    this.footer = modal.footer || this.footer;
    this.width = modal.width || this.width;
    this.height = modal.height || this.height;
    this.reRender();
  };

  /**
   * Function to add more actions to header e.g. close button, back button etc.
   *
   * @param { ActionsType } action must be an object with id and content
   */
  addHeaderActions = (action: ActionsType): void => {
    // if header.content has already been defined by the user
    if (typeof this.header?.actions === 'object') {
      this.header?.actions?.push(action);
    } else {
      this.header!.actions = [action];
    }

    this.reRender();
  };

  /**
   * Function to add more actions to footer
   *
   * @param { ActionsType } action must be an object with id and content
   */
  addFooterActions = (action: ActionsType): void => {
    if (typeof this.header?.actions === 'object') {
      this.footer?.actions?.push(action);
    } else {
      this.footer!.actions = [action];
    }
    this.reRender();
  };

  /**
   * Function to remove actions from header
   *
   * @param { string } id of the action to be deleted
   */
  removeHeaderActions = (id: string): void => {
    if (!this.header?.actions || typeof this.header?.actions !== 'object') {
      return;
    }
    const actionIndex = this.header?.actions?.findIndex((action) => action.id === id);
    if (actionIndex === -1) return;
    this.header?.actions?.splice(actionIndex, 1);
    this.reRender();
  };

  /**
   * Function to remove actions from footer
   *
   * @param { string } id of the action to be deleted
   */
  removeFooterActions = (id: string): void => {
    if (!this.footer?.actions || typeof this.header?.actions !== 'object') return;
    const actionIndex = this.footer?.actions?.findIndex((action) => action.id === id);
    if (actionIndex === -1) return;
    this.footer?.actions?.splice(actionIndex, 1);
    this.reRender();
  };

  /**
   * to update the modal as soon as a change is made to any content
   */
  reRender = (): void => {
    api.event.emit(EVENT_NAMES.EVENT_MODAL_UPDATE, this.mapId, { id: this.id });
  };
}

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
    const id = modal.id ? modal.id : generateId('');
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
   * @param { string | any } id of the modal that is to be deleted
   */
  deleteModal = (id: string | any): void => {
    if (!Object.keys(this.modals)) return;
    delete this.modals[id];
  };
}

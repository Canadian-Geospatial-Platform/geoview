import { ReactNode } from 'react';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { modalHeader, modalFooter, TypeModalProps, ModalActionsType } from './modal-api';
import { modalPayload } from '@/api/events/payloads';

/**
 * Class used to create a template (model) of a modal
 *
 * @class ModalModel
 */
export class ModalModel {
  modalModelId?: string;

  header?: modalHeader;

  content: ReactNode | string;

  footer?: modalFooter;

  active?: boolean;

  mapId?: string;

  width?: string | number;

  height?: string | number;

  /**
   * constructor to initiate the modal properties
   *
   * @param { ReactNode | string } content is the body copy (description) of the modal
   */
  constructor(content: ReactNode | string) {
    this.content = content;
  }

  /**
   * Trigger an event to open the modal
   */
  open = (): void => {
    this.active = true;

    api.event.emit(modalPayload(EVENT_NAMES.MODAL.EVENT_MODAL_OPEN, this.mapId!, this.modalModelId!, true));
  };

  /**
   * Trigger an event to close the modal
   */
  close = (): void => {
    this.active = false;

    api.event.emit(modalPayload(EVENT_NAMES.MODAL.EVENT_MODAL_CLOSE, this.mapId!, this.modalModelId!, false));
  };

  /**
   * Function to update the content of currently existing modal. Only the
   * passed properties will replace the old ones
   *
   * @param { TypeModalProps } modal must be an object with the above defined (TypeModalProps) properties
   */
  update = (modal: TypeModalProps): void => {
    this.modalModelId = modal.modalId || this.modalModelId;

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
   * @param { ModalActionsType } action must be an object with id and content
   */
  addHeaderActions = (action: ModalActionsType): void => {
    // if header.content has already been defined by the user
    if (typeof this.header?.actions === 'object') {
      this.header?.actions?.push(action);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.header!.actions = [action];
    }

    this.reRender();
  };

  /**
   * Function to add more actions to footer
   *
   * @param { ModalActionsType } action must be an object with id and content
   */
  addFooterActions = (action: ModalActionsType): void => {
    if (typeof this.header?.actions === 'object') {
      this.footer?.actions?.push(action);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.footer!.actions = [action];
    }
    this.reRender();
  };

  /**
   * Function to remove actions from header
   *
   * @param { string } actionId of the action to be deleted
   */
  removeHeaderActions = (actionId: string): void => {
    if (!this.header?.actions || typeof this.header?.actions !== 'object') {
      return;
    }
    const actionIndex = this.header?.actions?.findIndex((action) => action.actionId === actionId);
    if (actionIndex === -1) return;
    this.header?.actions?.splice(actionIndex, 1);
    this.reRender();
  };

  /**
   * Function to remove actions from footer
   *
   * @param { string } actionId of the action to be deleted
   */
  removeFooterActions = (actionId: string): void => {
    if (!this.footer?.actions || typeof this.header?.actions !== 'object') return;
    const actionIndex = this.footer?.actions?.findIndex((action) => action.actionId === actionId);
    if (actionIndex === -1) return;
    this.footer?.actions?.splice(actionIndex, 1);
    this.reRender();
  };

  /**
   * to update the modal as soon as a change is made to any content
   */
  reRender = (): void => {
    api.event.emit(modalPayload(EVENT_NAMES.MODAL.EVENT_MODAL_UPDATE, this.mapId!, this.modalModelId!));
  };
}

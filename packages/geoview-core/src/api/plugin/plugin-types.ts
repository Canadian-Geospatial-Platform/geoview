import { AnySchemaObject } from 'ajv';
import React from 'react';
import { TypeJsonObject, TypeJsonValue } from '@/core/types/global-types';
import { API } from '@/api';

/** ******************************************************************************************************************************
 * interface used when creating the actual plugin.
 */
export type TypePluginStructure = {
  // id of the plugin
  pluginId: string;
  api: API;
  createElement: typeof React.createElement;
  react: typeof React;
  props: TypeJsonValue;
  translate: TypeJsonValue;
  translations: TypeJsonObject;
  configObj: TypeJsonObject;
  schema?: () => AnySchemaObject;
  defaultConfig?: () => TypeJsonObject;
  added?: () => void;
  removed?: () => void;
  onSelected?: () => void;
};

/** ******************************************************************************************************************************
 * Record of plugins.
 */
export type TypeRecordOfPlugin = { [pluginId: string]: TypePluginStructure };

import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContext } from '../../app-start';
import { api, TypeDisplayLanguage } from '../../../app';
import { TypeJsonArray } from '../../types/global-types';
import { LayersList } from './layers-list';

export interface TypeLayerData {
  layerName: string;
  features: TypeJsonArray;
}

/**
 * The Details component is used to display a list of layers and their content.
 *
 * @returns {JSX.Element} returns the Details component
 */
export function Details(props): JSX.Element | null {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [layerData, setLayerData] = useState<TypeLayerData>({ layerName: '', features: [] });

  useEffect(() => {
    setLayerData(props.details);
  }, [props.details]);

  return <div>{layerData.features.length > 0 ? <LayersList layerData={layerData} /> : null}</div>;
}

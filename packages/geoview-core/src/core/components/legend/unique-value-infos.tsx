import React, { useContext, useEffect, useState } from 'react';

import makeStyles from '@mui/styles/makeStyles';
import Avatar from '@mui/material/Avatar';

import { TypeIconSymbolVectorConfig, TypeUniqueValueStyleConfig } from '../../../app';
import { VectorIcon } from './vector-icon';

const useStyles = makeStyles((theme) => ({
  icon: {
    width: 24,
    height: 24,
  },
  esriIconSize: {
    width: 20,
    height: 20,
  },
}));

export interface TypeUniqueValueInfosProps {
  uniqueInfoConfig: TypeUniqueValueStyleConfig;
}
/**
 * Unique Value Infos in a Legend Item
 *
 * @returns {JSX.Element} the unique value infos
 */
export function UniqueValueInfos(props: TypeUniqueValueInfosProps): JSX.Element {
  const classes = useStyles();

  const { uniqueInfoConfig } = props;

  return (
    <>
      {uniqueInfoConfig.uniqueValueStyleInfo.map((uniqueValue) => {
        return (
          <div key={uniqueValue.values[0]}>
            <div style={{ display: 'inline-flex' }}>
              {uniqueValue.settings.type === 'iconSymbol' && (
                <Avatar
                  className={classes.esriIconSize}
                  variant="square"
                  src={`data:${(uniqueValue.settings as TypeIconSymbolVectorConfig).mimeType};base64,${
                    (uniqueValue.settings as TypeIconSymbolVectorConfig).src
                  }`}
                />
              )}
              {uniqueValue.settings.type !== 'iconSymbol' && <VectorIcon settings={uniqueValue.settings} />}
              &nbsp;&nbsp;&nbsp;&nbsp;{`${uniqueValue.label}`}
            </div>
          </div>
        );
      })}
    </>
  );
}

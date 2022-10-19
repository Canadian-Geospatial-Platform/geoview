import React, { useEffect } from 'react';

import makeStyles from '@mui/styles/makeStyles';
import SvgIcon from '@mui/material/SvgIcon';

import { TypeKinfOfSymbolVectorSettings, TypeSimpleSymbolVectorConfig, TypeStrokeSymbolConfig } from '../../../app';

const useStyles = makeStyles((theme) => ({
}));

export interface TypeVectorIconProps {
  settings: TypeKinfOfSymbolVectorSettings;
}
/**
 * Vector Icon for a Legend
 *
 * @returns {JSX.Element} the vector icon
 */
export function VectorIcon(props: TypeVectorIconProps): JSX.Element {

  const classes = useStyles();

  const { settings } = props;

  const [iconPath, setIconPath] = React.useState<string | null>(null);
  const [iconColor, setIconColor] = React.useState<string>('rgba(15,76,106,1)');
  const [iconStroke, setIconStroke] = React.useState<TypeStrokeSymbolConfig | null>(null);

  const simpleSymbolParser = (setting: TypeSimpleSymbolVectorConfig) => {
    if (setting.symbol === 'circle') {
      setIconPath('circle');
    } else if (setting.symbol === 'diamond') {
      setIconPath('M 20,10 L 10,0 0,10 10,20 Z');
    } else if (setting.symbol === '+') {
      setIconPath('M 0,10 L 20,10 M 10,0 L 10,20');
    } else if (setting.symbol === 'square') {
      setIconPath('M 0,0 20,0 20,20 0,20 Z');
    } else if (setting.symbol === 'triangle') {
      setIconPath('M 20,20 L 10,0 0,20 Z');
    } else if (setting.symbol === 'X') {
      setIconPath('M 0,0 L 20,20 M 20,0 L 0,20');
    } else if (setting.symbol === 'star') {
      // TODO
      setIconPath('');
    } else if (setting.symbol === 'cross') {
      // TODO
      setIconPath('');
    }

    if (setting.color) {
      setIconColor(setting.color);
    }

    if (setting.stroke) {
      setIconStroke(setting.stroke);
    }
  };

  useEffect(() => {
    if (settings.type === 'simpleSymbol') {
      simpleSymbolParser(settings as TypeSimpleSymbolVectorConfig);
    }
  }, []);

  return (
    <SvgIcon sx={{ color: iconColor }} stroke={iconStroke?.color || ''} strokeWidth={iconStroke?.width || ''}>
      {iconPath === 'circle' && <circle cx="10" cy="10" r="10" />}
      {iconPath !== 'circle' && <path d={iconPath || ''} />}
    </SvgIcon>
  );
}

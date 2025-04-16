export interface LegendSymbol {
  image: string;
  label: string;
  description?: string;
}

export interface LegendSection {
  title: string;
  description?: string;
  symbols: LegendSymbol[];
}

export interface StyleOptions {
  symbolSize?: number;
  spacing?: number;
  layout?: 'vertical' | 'horizontal';
  containerClass?: string;
  symbolClass?: string;
  labelClass?: string;
}

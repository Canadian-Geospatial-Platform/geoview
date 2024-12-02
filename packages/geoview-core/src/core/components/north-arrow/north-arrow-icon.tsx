import { memo } from 'react';

/**
 * interface for north arrow icon properties
 */
interface NorthArrowIconProps {
  width: number;
  height: number;
}

/**
 * Create a north arrow icon
 *
 * @param {NorthArrowIconProps} props north arrow icon properties
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const NorthArrowIcon = memo(function NorthArrowIcon(props: NorthArrowIconProps): JSX.Element {
  const { width, height } = props;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 24 24"
      focusable="false"
      style={{ width, height }}
    >
      <g id="northarrow" transform="translate(-285.24 -142.234)">
        <path
          id="path3770-7"
          d="M305.91 156.648a8.652 8.652 0 0 1-8.654 8.653 8.652 8.652 0 0 1-8.653-8.653 8.653 8.653 0 0 1 8.653-8.653 8.653 8.653 0 0 1 8.653 8.653z"
          fill="#fff"
          stroke="#fff"
          strokeWidth=".895"
        />
        <path
          id="path3770"
          d="M304.982 156.648a7.725 7.725 0 0 1-7.726 7.726 7.725 7.725 0 0 1-7.726-7.726 7.725 7.725 0 0 1 7.726-7.726 7.725 7.725 0 0 1 7.726 7.726z"
          fill="none"
          stroke="#6d6d6d"
          strokeWidth=".799"
        />
        <path id="path3774" d="M297.256 156.648v-8.525" fill="none" stroke="#000" strokeWidth=".067" />
        <path d="M297.258 143.48l8.793 22.432-8.811-8.812-8.812 8.812z" id="path3778" fill="#fff" stroke="#fff" strokeWidth=".912" />
        <path
          d="M297.256 144.805l7.726 19.568-7.726-7.726-7.726 7.726z"
          id="path3780"
          fill="#d6d6d6"
          stroke="#000"
          strokeWidth=".266"
          strokeLinecap="square"
        />
        <path id="path6038" d="M297.256 144.666l-7.726 19.568 7.726-7.726" fill="#6d6d6d" strokeWidth=".296" strokeLinecap="square" />
      </g>
    </svg>
  );
});

/**
 * Create a north pole icon
 *
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const NorthPoleIcon = memo(function NorthPoleIcon(): JSX.Element {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
      <path d="M0 0h24v24H0z" fill="none" />
      <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
    </svg>
  );
});

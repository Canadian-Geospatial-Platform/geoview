import React from 'react';
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function OpenIn3dIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <polygon
        // fill="#231f20"
        fillRule="evenodd"
        points="11.92 0 16.8 2.72 21.7 5.45 16.8 8.17 11.92 10.89 7.02 8.17 2.14 5.45 7.02 2.72 11.92 0"
      />
      <polygon fillRule="evenodd" points="1.45 7.1 10.89 12.54 10.89 24 1.47 18.47 1.45 7.1" />
      <polygon fillRule="evenodd" points="22.55 7.1 13.11 12.54 13.11 24 22.53 18.47 22.55 7.1" />
    </SvgIcon>
  );
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function OpenStacApiIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M0,0v16.2h2.4V2.4h13.8V0H0Z" />
      <path d="M3.9,3.91v16.19h2.4V6.31h13.79v-2.4H3.9Z" />
      <g>
        <polygon points="11.64 16.71 12.63 16.71 12.14 14.62 11.64 16.71" />
        <path d="M18.1,14.06c-.09-.09-.21-.14-.36-.14h-.72v1.82h.72c.15,0,.27-.04.36-.11.09-.07.16-.17.2-.3.04-.13.06-.27.06-.44,0-.17-.02-.33-.06-.48-.04-.15-.11-.27-.2-.36Z" />
        <path d="M7.8,7.8v16.2h16.2V7.8H7.8ZM13.18,19.06l-.28-1.18h-1.54l-.28,1.18h-1.6l1.95-6.32h1.39l1.95,6.32h-1.6ZM19.61,15.95c-.17.3-.42.54-.73.71-.31.17-.69.25-1.13.25h-.72v2.14h-1.48v-6.32h2.2c.44,0,.82.09,1.13.28.32.18.56.44.73.76.17.32.26.69.26,1.1s-.08.76-.26,1.07ZM22.31,19.06h-1.48v-6.32h1.48v6.32Z" />
      </g>
    </SvgIcon>
  );
}

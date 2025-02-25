import { CSSProperties } from 'react';

export const getSxClasses = (): { legendButton: CSSProperties; legendPanel: CSSProperties } => ({
  legendButton: {
    padding: '8px',
    cursor: 'pointer',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendPanel: {
    position: 'absolute' as const, // Type assertion for position property
    right: '10px',
    top: '50px',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '16px',
    minWidth: '200px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
});

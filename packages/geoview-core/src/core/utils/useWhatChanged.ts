import { useEffect, useRef } from 'react';

// Indicates if currently logging useWhatChanged
const CURRENT_ACTIVE = true;
const USE_USE_EFFECT_REACT_18_CHECK = false;

// Helper type for logging
type DependencyLog = {
  [key: string]: { 'Old Value': unknown; 'New Value': unknown };
};

/**
 * Gets a random color
 * @returns {string} A random hex color value
 */
function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * Stringifies a value for logging purposes
 * @param {unknown} dependencyItem - The value to stringify
 * @returns {string | unknown} Stringified value (when possible)
 */
function stringifyValue(dependencyItem: unknown): string | unknown {
  try {
    if (dependencyItem) {
      if (typeof dependencyItem === 'object' || Array.isArray(dependencyItem)) {
        return JSON.stringify(dependencyItem, null, 2);
      }
    }
    return dependencyItem;
  } catch (e) {
    // Failed to read as string
    return 'COMPLEX OBJECT';
  }
}

/**
 * Helper function to create a hook on a hot reference
 * @param {unknown} value - The value to hook in a reference
 * @returns {React<useRef>} The React reference to the value
 */
// ? unknown type cannot be use, need to escape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useHotRefs(value: unknown): any {
  const fnRef = useRef<unknown>(value);
  useEffect(() => {
    fnRef.current = value;
  });
  return fnRef;
}

/**
 * Helper function to write to console
 * @param {unknown[]} messages - The messages to write to console
 */
function writeConsole(...messages: unknown[]): void {
  // eslint-disable-next-line no-console
  console.log(...messages);
}

/**
 * Exposes a function to help debug react hooks and their dependencies
 * @param {string} hookId - An indentifier for the given hook
 * @param {unknown[]} dependency - The dependency array
 * @param {string[]} dependencyNames? - The optional depedency names for each dependency in the array (strictly for user readability)
 */
export const useWhatChanged = (hookId: string, dependency?: unknown[], dependencyNames?: string[]): void => {
  // This ref is responsible for book keeping of the old value
  const dependencyRef = useRef(dependency);

  // For count bookkeeping , for easy debugging
  const whatChangedHookCountRef = useRef(0);

  // For assigning color for easy debugging
  const backgroundColorRef = useRef('');

  // Flag for a cleaner logging when using React18+ and double useEffect reasons (when working in react.StrictMode)
  const useEffectRan = useRef(false);

  // Logs footer information
  function logFooter(): void {
    writeConsole(`%c----- END SECTION -----`, `background: ${backgroundColorRef.current}; color: white; font-size: 10px`, '\n');
    writeConsole('\n');
  }

  // Logs header information
  function logHeader({
    isFirstMount,
    suffixText,
    isBlankArrayAsDependency,
  }: {
    isFirstMount?: boolean;
    suffixText?: string;
    isBlankArrayAsDependency?: boolean;
  }): void {
    if (CURRENT_ACTIVE) {
      writeConsole(`%c----- START SECTION -----`, `background: ${backgroundColorRef.current}; color: white; font-size: 10px`, '\n');
      writeConsole(
        `%c ${whatChangedHookCountRef.current} ${hookId || ''}`,
        `background: ${backgroundColorRef.current}; color: white; font-size: 10px`,
        '👇🏾',
        `${isFirstMount ? 'FIRST RUN' : 'UPDATES'}`,
        `${suffixText}`
      );

      if (isBlankArrayAsDependency) {
        logFooter();
      }
    }
  }

  const longBannersRef = useHotRefs(logHeader);

  // Prepare a hook for the given dependency reference.
  // This will attribute a number and a color for the mounted component.
  useEffect(() => {
    // Preconds
    if (!dependencyRef.current) return;
    if (USE_USE_EFFECT_REACT_18_CHECK && !useEffectRan.current) return;

    // Increment the index
    whatChangedHookCountRef.current++;
    // Get a random color for that mounted component
    backgroundColorRef.current = getRandomColor();
  }, [dependencyRef]);

  // Prepare a hook tracking the modifications in the dependencies.
  // This will verify which dependency changed and log a table in the console.
  useEffect(() => {
    // Preconds
    if (!dependencyRef.current) return;
    if (USE_USE_EFFECT_REACT_18_CHECK && !useEffectRan.current) return;

    // More info, if needed by user
    let changed = false;
    const whatChanged = dependency
      ? dependency.reduce((acc: DependencyLog, dep, index) => {
          // Read dependency name
          const depName = (dependencyNames && dependencyNames[index]) || index;

          // If different
          if (dependencyRef.current && dep !== dependencyRef.current[index]) {
            // Flag
            changed = true;

            // Swap
            const oldValue = dependencyRef.current[index];
            dependencyRef.current[index] = dep;

            acc[`"✅" ${depName}`] = {
              'Old Value': stringifyValue(oldValue),
              'New Value': stringifyValue(dep),
            };
          } else {
            acc[`"⏺" ${depName}`] = {
              'Old Value': stringifyValue(dependencyRef.current?.[index] || dep),
              'New Value': stringifyValue(dep),
            };
          }
          return acc;
        }, {})
      : {};

    if (CURRENT_ACTIVE) {
      const isBlankArrayAsDependency = whatChanged && Object.keys(whatChanged).length === 0;
      longBannersRef.current({
        isFirstMount: !changed,
        suffixText: isBlankArrayAsDependency ? ` 👉🏽 This will run only once on mount.` : ``,
        isBlankArrayAsDependency,
      });

      if (!isBlankArrayAsDependency) {
        writeConsole(whatChanged);
        logFooter();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...(() => {
      return dependency || [];
    })(),
    dependencyRef,
    longBannersRef,
  ]);

  // Prepare a hook for React18+ and double useEffect reasons (when working in react.StrictMode).
  // This will verify which dependency changed and log a table in the console.
  useEffect(() => {
    // Use Effect ran once
    return () => {
      useEffectRan.current = true;
    };
  }, []);
};

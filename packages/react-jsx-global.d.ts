/**
 * React 19 removed the global JSX namespace. This file restores it for backward compatibility.
 *
 * @see https://react.dev/blog/2024/04/25/react-19-upgrade-guide#the-jsx-namespace-in-typescript
 */
export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    type Element = import('react').JSX.Element;
    type ElementClass = import('react').JSX.ElementClass;
    type IntrinsicElements = import('react').JSX.IntrinsicElements;
    type IntrinsicAttributes = import('react').JSX.IntrinsicAttributes;
    type ElementAttributesProperty = import('react').JSX.ElementAttributesProperty;
    type ElementChildrenAttribute = import('react').JSX.ElementChildrenAttribute;
    type IntrinsicClassAttributes<T> = import('react').JSX.IntrinsicClassAttributes<T>;
    type LibraryManagedAttributes<C, P> = import('react').JSX.LibraryManagedAttributes<C, P>;
  }
}

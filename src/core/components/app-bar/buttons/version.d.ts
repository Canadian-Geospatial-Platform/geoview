/** Version information for the application. */
export type TypeAppVersion = {
    hash: string;
    major: number;
    minor: number;
    patch: number;
    timestamp: string;
};
/**
 * Version button and popover panel displaying app version, build date, and links.
 *
 * Not memoized because it has no props and the component's internal state
 * (popover open/close) changes independently.
 *
 * @returns The version button and popover panel
 */
export default function Version(): JSX.Element;
//# sourceMappingURL=version.d.ts.map
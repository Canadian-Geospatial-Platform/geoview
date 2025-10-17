import type { DrawerProps } from '@mui/material';
/**
 * Properties for the Drawer component extending Material-UI's DrawerProps
 */
export interface DrawerPropsExtend extends DrawerProps {
    status?: boolean;
}
/**
 * Create a customized Material UI Drawer component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Drawer>
 *   <List>
 *     <ListItem>Content</ListItem>
 *   </List>
 * </Drawer>
 *
 * // With controlled state
 * <Drawer
 *   status={isOpen}
 *   variant="permanent"
 * >
 *   <List>
 *     <ListItem>Drawer content</ListItem>
 *   </List>
 * </Drawer>
 *
 * // With custom styling
 * <Drawer
 *   className="custom-drawer"
 *   style={{ width: 240 }}
 * >
 *   <div>Drawer content</div>
 * </Drawer>
 * ```
 *
 * @param {DrawerPropsExtend} props - The properties passed to the Drawer element
 * @returns {JSX.Element} The Drawer component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/react-drawer/}
 */
declare function DrawerUI(props: DrawerPropsExtend): JSX.Element;
export declare const Drawer: typeof DrawerUI;
export {};
//# sourceMappingURL=drawer.d.ts.map
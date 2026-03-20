import type { DrawerProps } from '@mui/material';
/**
 * Properties for the Drawer component extending Material-UI's DrawerProps
 */
export interface DrawerPropsExtend extends DrawerProps {
    status?: boolean;
}
/**
 * Material-UI Drawer component with collapsible toggle functionality.
 *
 * Wraps Material-UI's Drawer to provide a slide-out side panel with built-in
 * toggle button for opening/closing. Supports status prop for controlled state.
 * Default variant is temporary (slides over content). All Material-UI Drawer props
 * are supported and passed through directly.
 *
 * @param props - Drawer configuration (see DrawerPropsExtend interface)
 * @returns Drawer component with toggle button and theme-aware styling
 *
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
 * @see {@link https://mui.com/material-ui/react-drawer/}
 */
declare function DrawerUI(props: DrawerPropsExtend): JSX.Element;
export declare const Drawer: typeof DrawerUI;
export {};
//# sourceMappingURL=drawer.d.ts.map
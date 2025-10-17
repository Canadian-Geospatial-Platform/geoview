import type { StepperProps, StepLabelProps, StepContentProps, StepProps } from '@mui/material';
/**
 * Custom MUI Stepper Props
 */
interface StepperPropsExtend extends StepperProps {
    steps: (TypeStep | null)[];
}
/**
 * Object that holds a step of a stepper component
 */
interface TypeStep {
    id?: string | null;
    stepLabel?: StepLabelProps;
    stepContent?: StepContentProps;
    props?: StepProps;
}
/**
 * Create a customized Material UI Stepper component.
 * This component provides a step-by-step interface with configurable
 * labels and content for each step.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Stepper
 *   activeStep={1}
 *   steps={[
 *     {
 *       stepLabel: { label: 'Step 1' },
 *       stepContent: { children: 'Content for step 1' }
 *     },
 *     {
 *       stepLabel: { label: 'Step 2' },
 *       stepContent: { children: 'Content for step 2' }
 *     }
 *   ]}
 * />
 *
 * // With custom styling and optional step
 * <Stepper
 *   activeStep={0}
 *   orientation="vertical"
 *   steps={[
 *     {
 *       id: "step1",
 *       stepLabel: {
 *         label: 'First Step',
 *         optional: <Typography variant="caption">Optional</Typography>
 *       },
 *       stepContent: { children: 'Step content' },
 *       props: { sx: { my: 1 } }
 *     },
 *     null,  // Skip this step
 *     {
 *       stepLabel: { label: 'Final Step' },
 *       stepContent: { children: 'Final content' }
 *     }
 *   ]}
 * />
 * ```
 *
 * @param {StepperPropsExtend} props - The properties passed to the Stepper element
 * @returns {JSX.Element} The Stepper component
 *
 * @see {@link https://mui.com/material-ui/react-stepper/}
 */
declare function StepperUI(props: StepperPropsExtend): JSX.Element;
export declare const Stepper: typeof StepperUI;
export {};
//# sourceMappingURL=stepper.d.ts.map
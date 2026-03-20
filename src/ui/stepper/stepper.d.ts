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
 * Material-UI Stepper component for step-by-step workflows.
 *
 * Wraps Material-UI's Stepper with configurable labels and content for each step.
 * Supports vertical and horizontal orientations with optional step content sections.
 * Steps can be skipped by passing null in the steps array.
 *
 * @param props - Stepper configuration (see StepperPropsExtend interface)
 * @returns Stepper component with step indicators and optional content sections
 *
 * @example
 * ```tsx
 * <Stepper
 *   activeStep={1}
 *   steps={[
 *     { stepLabel: { label: 'Step 1' }, stepContent: { children: 'Content 1' } },
 *     { stepLabel: { label: 'Step 2' }, stepContent: { children: 'Content 2' } }
 *   ]}
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-stepper/}
 */
declare function StepperUI(props: StepperPropsExtend): JSX.Element;
export declare const Stepper: typeof StepperUI;
export {};
//# sourceMappingURL=stepper.d.ts.map
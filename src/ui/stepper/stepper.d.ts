import { StepperProps, StepLabelProps, StepContentProps, StepProps } from '@mui/material';
/**
 * Custom MUI Stepper Props
 */
interface TypeStepperProps extends StepperProps {
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
 * Create a Material UI Stepper component
 *
 * @param {TypeStepperProps} props custom stepper properties
 * @returns {JSX.Element} the auto complete ui component
 */
export declare function Stepper(props: TypeStepperProps): JSX.Element;
export {};

import { CSSProperties } from 'react';
/**
 * Properties for the Custom Stepper
 */
interface TypeCustomStepperProps {
    id: string;
    className?: string;
    style?: CSSProperties;
    orientation?: 'horizontal' | 'vertical';
    alternativeLabel?: boolean;
    nonLinear?: boolean;
    buttonedLabels?: boolean;
    steps?: Array<Record<string, TypeStepperSteps>>;
    backButtonText?: string;
    nextButtonText?: string;
    resetButtonText?: string;
}
/**
 * Properties for the Steps of Stepper
 */
export interface TypeStepperSteps {
    label?: string;
    description: JSX.Element | HTMLElement | string;
    disableStepMovement?: boolean;
}
/**
 * Create a customizable Material UI Stepper
 *
 * @param {TypeCustomStepperProps} props the properties passed to the Stepper element
 * @returns {JSX.Element} the created Stepper element
 */
export declare function CustomStepper(props: TypeCustomStepperProps): JSX.Element;
export {};

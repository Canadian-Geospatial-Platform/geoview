import { CSSProperties, useState } from "react";

import { Box, Stepper as MaterialStepper, Typography } from "@mui/material";
import { Step as MaterialStep } from "@mui/material";
import { StepLabel as MaterialStepLabel } from "@mui/material";
import { StepButton as MaterialStepButton } from "@mui/material";
import { StepContent as MaterialStepContent } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { Button } from "../button";
import { Button as MaterialButton } from "@mui/material";

const useStyles = makeStyles((theme) => ({
  stepperContainer: {
    padding: 15,
    width: 500,
    minWidth: 150,
    border: "0.5px solid grey",
    flexWrap: "wrap",
    "& .MuiSvgIcon-root.Mui-active": {
      color: "#90caf9",
    },
  },
  actionContainer: {
    marginTop: 20,
    width: "100%",
    display: "flex",
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-between",
    "&>*:first-child": {
      width: "100%",
      marginBottom: 8,
    },
    "& > button": {
      width: "30%",
    },
    "& > button > *": {
      textAlign: "center",
    },
  },
  disabledButton: {
    display: "flex",
    fontSize: theme.typography.fontSize,
    paddingLeft: 18,
    paddingRight: 20,
    justifyContent: "center",
    width: "100%",
    height: 50,
    backgroundColor: theme.palette.primary.dark,
    color: "grey !important",
  },
}));

interface TypeStepperSteps {
  label?: string;
  description?: string;
}

/**
 * Properties for the Stepper
 */
interface StepperProps {
  className?: string;
  style?: CSSProperties;
  orientation?: "horizontal" | "vertical";
  alternativeLabel?: boolean;
  nonLinear?: boolean;
  buttonedLabels?: boolean;
  steps?: Array<Record<string, TypeStepperSteps>> | any;
}

/**
 * Create a customizable Material UI Stepper
 *
 * @param {StepperProps} props the properties passed to the Stepper element
 * @returns {JSX.Element} the created Stepper element
 */
export const Stepper = (props: StepperProps): JSX.Element => {
  const [activeStep, setActiveStep] = useState(0);
  const {
    className,
    style,
    orientation,
    alternativeLabel,
    nonLinear,
    buttonedLabels,
    steps,
  } = props;

  const classes = useStyles();

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStep = (stepIndex: number) => () => {
    setActiveStep(stepIndex);
  };

  return (
    <Box>
      <MaterialStepper
        className={`${classes.stepperContainer} ${className && className}`}
        style={style || undefined}
        orientation={orientation !== undefined ? orientation : "horizontal"}
        activeStep={activeStep}
        alternativeLabel={
          orientation === "horizontal" ? alternativeLabel : false
        }
        nonLinear={nonLinear || buttonedLabels || false}
      >
        {steps?.map((step: any, index: number) => {
          return (
            <MaterialStep key={step.label}>
              <>
                {buttonedLabels || (
                  <MaterialStepLabel>
                    <Typography variant="caption">{step.label}</Typography>
                  </MaterialStepLabel>
                )}
                {orientation === "vertical" && (
                  <MaterialStepContent>
                    <Typography>{step.description}</Typography>
                  </MaterialStepContent>
                )}
                {buttonedLabels && (
                  <MaterialStepButton onClick={handleStep(index)}>
                    {step.label}
                  </MaterialStepButton>
                )}
              </>
            </MaterialStep>
          );
        })}
        <Box className={classes.actionContainer}>
          <>
            <Typography>
              {activeStep === steps.length
                ? "Steps Completed"
                : `Step ${activeStep + 1}`}
            </Typography>
            {activeStep === steps.length || (
              <>
                {activeStep < 1 ? (
                  <MaterialButton disabled className={classes.disabledButton}>
                    BACK
                  </MaterialButton>
                ) : (
                  <Button type="text" onClick={handleBack}>
                    BACK
                  </Button>
                )}
                <Button type="text" onClick={handleNext}>
                  Next
                </Button>
              </>
            )}
            {activeStep === steps.length && (
              <Button
                type="text"
                //   className={classes}
                onClick={handleReset}
              >
                Reset
              </Button>
            )}
          </>
        </Box>
      </MaterialStepper>
    </Box>
  );
};

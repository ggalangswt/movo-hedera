"use client";

import React from "react";
import { motion } from "framer-motion";

export interface Step {
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  orientation?: "horizontal" | "vertical";
  allowClickableSteps?: boolean;
  variant?: "default" | "circle" | "minimal";
  showDescription?: boolean;
}

export default function Stepper({
  steps,
  currentStep,
  onStepClick,
  orientation = "horizontal",
  allowClickableSteps = false,
  variant = "default",
  showDescription = true,
}: StepperProps) {
  const isHorizontal = orientation === "horizontal";

  const getStepStatus = (index: number) => {
    if (index < currentStep) return "completed";
    if (index === currentStep) return "active";
    return "pending";
  };

  const handleStepClick = (index: number) => {
    if (allowClickableSteps && onStepClick && index <= currentStep) {
      onStepClick(index);
    }
  };

  const renderDefaultStepper = () => (
    <div
      className={`flex ${
        isHorizontal ? "flex-row items-center" : "flex-col"
      } gap-2`}
    >
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isCompleted = status === "completed";
        const isActive = status === "active";
        const isClickable = allowClickableSteps && index <= currentStep;

        return (
          <React.Fragment key={index}>
            {/* Step Item */}
            <div
              className={`flex ${
                isHorizontal ? "flex-col items-center" : "flex-row items-start"
              } gap-2 ${isClickable ? "cursor-pointer" : ""}`}
              onClick={() => handleStepClick(index)}
            >
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={`relative flex items-center justify-center w-1 h-1 rounded-full border-2 transition-all duration-300 ${
                    isCompleted
                      ? "bg-blue-600 border-blue-600"
                      : isActive
                      ? "bg-white border-blue-600"
                      : "bg-white border-gray-300"
                  } ${isClickable ? "hover:scale-110" : ""}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {isCompleted ? (
                    <motion.svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  ) : step.icon ? (
                    <span
                      className={`text-lg ${
                        isActive ? "text-blue-600" : "text-gray-400"
                      }`}
                    >
                      {step.icon}
                    </span>
                  ) : (
                    <span
                      className={` ${
                        isActive ? "text-blue-600" : "text-gray-400"
                      }`}
                    >
                    </span>
                  )}
                </motion.div>
              </div>

              {/* Step Label */}
              <div
                className={`${
                  isHorizontal ? "text-center mt-2" : "ml-4 flex-1"
                }`}
              >
                <div
                  className={`text-sm font-medium transition-colors ${
                    isCompleted || isActive ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </div>
                {showDescription && step.description && (
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`${
                  isHorizontal
                    ? "flex-1 h-0.5 mx-2"
                    : "w-0.5 h-12 ml-5 my-1"
                }`}
              >
                <motion.div
                  className={`h-full transition-all duration-500 ${
                    index < currentStep ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  initial={{ scaleX: isHorizontal ? 0 : 1, scaleY: isHorizontal ? 1 : 0 }}
                  animate={{
                    scaleX: isHorizontal ? (index < currentStep ? 1 : 0) : 1,
                    scaleY: isHorizontal ? 1 : (index < currentStep ? 1 : 0),
                  }}
                  style={{
                    originX: isHorizontal ? 0 : 0.5,
                    originY: isHorizontal ? 0.5 : 0,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderCircleStepper = () => (
    <div className="flex items-center justify-center gap-6">
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isCompleted = status === "completed";
        const isActive = status === "active";
        const isClickable = allowClickableSteps && index <= currentStep;

        return (
          <React.Fragment key={index}>
            <div
              className={`relative flex flex-col items-center gap-2 ${
                isClickable ? "cursor-pointer" : ""
              }`}
              onClick={() => handleStepClick(index)}
            >
              <motion.div
                className={`relative flex items-center justify-center w-2 h-2 rounded-full border-1 transition-all duration-300 ${
                  isCompleted
                    ? "bg-blue-600 border-blue-600"
                    : isActive
                    ? "bg-white border-blue-600 shadow-lg shadow-blue-500/50"
                    : "bg-white border-gray-300"
                } ${isClickable ? "hover:scale-110" : ""}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: index * 0.1,
                }}
              >
                {isCompleted ? (
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span
                    className={` ${
                      isActive ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                  </span>
                )}

                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-blue-600"
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 1.3, opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}
              </motion.div>

              <div className="text-center">
                <div
                  className={`text-sm font-medium whitespace-nowrap ${
                    isCompleted || isActive ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </div>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className="flex-1 h-1 bg-gray-300 rounded-full overflow-hidden max-w-[100px]">
                <motion.div
                  className="h-full bg-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: index < currentStep ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderMinimalStepper = () => (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isCompleted = status === "completed";
        const isActive = status === "active";
        const isClickable = allowClickableSteps && index <= currentStep;

        return (
          <React.Fragment key={index}>
            <motion.div
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                isCompleted || isActive
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-400"
              } ${isClickable ? "cursor-pointer hover:scale-105" : ""}`}
              onClick={() => handleStepClick(index)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCompleted
                    ? "bg-blue-600 text-white"
                    : isActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-500"
                }`}
              >
                {isCompleted ? "✓" : index + 1}
              </div>
              <span className="text-sm font-medium">{step.label}</span>
            </motion.div>

            {index < steps.length - 1 && (
              <div className="w-8 h-0.5 bg-gray-300">
                <motion.div
                  className="h-full bg-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: index < currentStep ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  switch (variant) {
    case "circle":
      return renderCircleStepper();
    case "minimal":
      return renderMinimalStepper();
    default:
      return renderDefaultStepper();
  }
}

// Stepper with context for better state management
interface StepperContextValue {
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

const StepperContext = React.createContext<StepperContextValue | undefined>(
  undefined
);

export function useStepper() {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error("useStepper must be used within StepperProvider");
  }
  return context;
}

interface StepperProviderProps {
  children: React.ReactNode;
  initialStep?: number;
  totalSteps: number;
  onStepChange?: (step: number) => void;
}

export function StepperProvider({
  children,
  initialStep = 0,
  totalSteps,
  onStepChange,
}: StepperProviderProps) {
  const [currentStep, setCurrentStep] = React.useState(initialStep);

  const goToStep = React.useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
        onStepChange?.(step);
      }
    },
    [totalSteps, onStepChange]
  );

  const nextStep = React.useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const prevStep = React.useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const value: StepperContextValue = {
    currentStep,
    totalSteps,
    goToStep,
    nextStep,
    prevStep,
    canGoNext: currentStep < totalSteps - 1,
    canGoPrev: currentStep > 0,
  };

  return (
    <StepperContext.Provider value={value}>{children}</StepperContext.Provider>
  );
}

// Navigation buttons component
export function StepperNavigation() {
  const { currentStep, totalSteps, nextStep, prevStep, canGoNext, canGoPrev } =
    useStepper();

  return (
    <div className="flex items-center justify-between mt-8">
      <button
        onClick={prevStep}
        disabled={!canGoPrev}
        className={`px-6 py-2 rounded-lg font-medium transition-all ${
          canGoPrev
            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        Previous
      </button>

      <div className="text-sm text-gray-600">
        Step {currentStep + 1} of {totalSteps}
      </div>

      <button
        onClick={nextStep}
        disabled={!canGoNext}
        className={`px-6 py-2 rounded-lg font-medium transition-all ${
          canGoNext
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-blue-300 text-white cursor-not-allowed"
        }`}
      >
        {currentStep === totalSteps - 1 ? "Finish" : "Next"}
      </button>
    </div>
  );
}
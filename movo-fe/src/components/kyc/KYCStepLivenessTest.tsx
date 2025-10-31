"use client";

import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { MdCheckCircle, MdError } from "react-icons/md";

interface KYCStepLivenessTestProps {
  onComplete: () => void;
  onBack: () => void;
}

type LivenessAction = "smile" | "blink" | "turn_left" | "turn_right" | "nod";

interface LivenessStep {
  action: LivenessAction;
  instruction: string;
  icon: string;
}

const livenessSteps: LivenessStep[] = [
  { action: "smile", instruction: "Please smile", icon: "😊" },
  { action: "blink", instruction: "Blink your eyes", icon: "👁️" },
  { action: "turn_left", instruction: "Turn your head left", icon: "⬅️" },
  { action: "turn_right", instruction: "Turn your head right", icon: "➡️" },
  { action: "nod", instruction: "Nod your head", icon: "👇" },
];

export default function KYCStepLivenessTest({
  onComplete,
  onBack,
}: KYCStepLivenessTestProps) {
  const webcamRef = useRef<Webcam>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<LivenessAction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const currentStep = livenessSteps[currentStepIndex];
  const isComplete = completedSteps.length === livenessSteps.length;

  // Countdown before each action
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      // Simulate action detection after 2 seconds
      setTimeout(() => {
        handleActionComplete();
      }, 2000);
    }
  }, [countdown]);

  const startTest = () => {
    setHasStarted(true);
    setCountdown(3);
  };

  const handleActionComplete = () => {
    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setCompletedSteps([...completedSteps, currentStep.action]);
      setIsProcessing(false);

      if (currentStepIndex < livenessSteps.length - 1) {
        // Move to next step
        setTimeout(() => {
          setCurrentStepIndex(currentStepIndex + 1);
          setCountdown(3);
        }, 1000);
      }
    }, 1500);
  };

  const handleComplete = () => {
    // Simulate final verification
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user",
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Liveness Detection Test
        </h3>
        <p className="text-gray-600">
          Follow the instructions to verify you're a real person
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          className="bg-blue-600 h-full"
          initial={{ width: 0 }}
          animate={{
            width: `${(completedSteps.length / livenessSteps.length) * 100}%`,
          }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="text-sm text-gray-600 text-center">
        Step {completedSteps.length} of {livenessSteps.length} completed
      </p>

      {/* Camera Area */}
      <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video max-w-2xl mx-auto">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          onUserMedia={() => setIsCameraReady(true)}
          className="w-full h-full object-cover"
        />

        {/* Instruction Overlay */}
        {isCameraReady && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!hasStarted ? (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <div className="bg-white rounded-2xl p-8 max-w-md">
                    <h4 className="text-2xl font-bold text-gray-900 mb-4">
                      Ready to Start?
                    </h4>
                    <p className="text-gray-600 mb-6">
                      You'll be asked to perform {livenessSteps.length} simple actions to verify your identity
                    </p>
                    <button
                      onClick={startTest}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Start Liveness Test
                    </button>
                  </div>
                </motion.div>
              ) : countdown !== null ? (
                <motion.div
                  key="countdown"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-center"
                >
                  <div className="text-8xl font-bold text-white mb-4">
                    {countdown}
                  </div>
                  <p className="text-xl text-white">Get ready...</p>
                </motion.div>
              ) : !isComplete ? (
                <motion.div
                  key="instruction"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <div className="text-8xl mb-4">{currentStep.icon}</div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentStep.instruction}
                    </h4>
                    {isProcessing && (
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span>Verifying...</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="complete"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <div className="bg-white rounded-2xl p-8 max-w-md">
                    <MdCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      All Steps Completed!
                    </h4>
                    <p className="text-gray-600 mb-6">
                      Your liveness test has been successfully verified
                    </p>
                    <button
                      onClick={handleComplete}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Complete Verification
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Completed Steps Checklist */}
      {hasStarted && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Verification Steps:</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {livenessSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.action);
              const isCurrent = index === currentStepIndex && !isComplete;

              return (
                <div
                  key={step.action}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    isCompleted
                      ? "bg-green-50 border-green-500"
                      : isCurrent
                      ? "bg-blue-50 border-blue-500"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <span className="text-2xl">{step.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate">
                      {step.instruction}
                    </p>
                  </div>
                  {isCompleted && (
                    <MdCheckCircle className="text-green-500 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {!hasStarted && (
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
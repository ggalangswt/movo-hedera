"use client";

import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { motion } from "framer-motion";
import { MdCameraAlt, MdRefresh, MdCheckCircle } from "react-icons/md";
import Image from "next/image";

interface KYCStepFaceComparisonProps {
  onNext: (data: { selfieImage: Blob }) => void;
  onBack: () => void;
}

export default function KYCStepFaceComparison({
  onNext,
  onBack,
}: KYCStepFaceComparisonProps) {
  const webcamRef = useRef<Webcam>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string>("");

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user",
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setSelfieImage(imageSrc);
      setError("");
    }
  }, [webcamRef]);

  const retake = () => {
    setSelfieImage(null);
  };

  const handleNext = async () => {
    if (!selfieImage) {
      setError("Please capture your selfie");
      return;
    }

    // Convert base64 to blob
    const response = await fetch(selfieImage);
    const blob = await response.blob();

    onNext({ selfieImage: blob });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Face Verification
        </h3>
        <p className="text-gray-600">
          Take a selfie for identity verification
        </p>
      </div>

      {/* Camera/Preview Area */}
      <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video max-w-2xl mx-auto">
        {!selfieImage ? (
          <div className="relative w-full h-full">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMedia={() => setIsCameraReady(true)}
              onUserMediaError={(err) => {
                console.error("Camera error:", err);
                setError("Unable to access camera. Please check permissions.");
              }}
              className="w-full h-full object-cover"
            />

            {/* Face Overlay Guide */}
            {isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                >
                  {/* Face oval guide */}
                  <div className="w-64 h-80 border-4 border-white/50 rounded-[50%] shadow-2xl"></div>
                  
                  {/* Corner guides */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-2xl"></div>
                </motion.div>
              </div>
            )}

            {/* Instructions Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-center">
              <p className="text-white text-sm">
                Position your face within the frame
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full h-full"
          >
            <Image
              src={selfieImage}
              alt="Selfie Preview"
              fill
              className="object-cover"
            />
            <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
              <MdCheckCircle />
              Photo captured
            </div>
          </motion.div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Capture Button */}
      {!selfieImage ? (
        <div className="flex justify-center">
          <button
            onClick={capture}
            disabled={!isCameraReady}
            className={`px-8 py-4 rounded-full font-semibold transition-all flex items-center gap-2 ${
              isCameraReady
                ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <MdCameraAlt className="text-2xl" />
            Capture Photo
          </button>
        </div>
      ) : (
        <div className="flex justify-center">
          <button
            onClick={retake}
            className="px-8 py-4 bg-gray-600 text-white rounded-full font-semibold hover:bg-gray-700 transition-all flex items-center gap-2"
          >
            <MdRefresh className="text-2xl" />
            Retake Photo
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">📷 Tips for a good selfie:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Look directly at the camera</li>
          <li>Ensure good lighting on your face</li>
          <li>Remove glasses and face coverings</li>
          <li>Keep a neutral expression</li>
          <li>Make sure your entire face is visible</li>
        </ul>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selfieImage}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            selfieImage
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue to Liveness Test
        </button>
      </div>
    </div>
  );
}
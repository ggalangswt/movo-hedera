"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { MdCloudUpload, MdClose, MdCheckCircle } from "react-icons/md";
import Image from "next/image";

interface KYCStepUploadKTPProps {
  onNext: (data: { ktpImage: File; ktpNumber: string; fullName: string }) => void;
}

export default function KYCStepUploadKTP({ onNext }: KYCStepUploadKTPProps) {
  const [ktpImage, setKtpImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ktpNumber, setKtpNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setKtpImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrors({ ...errors, ktpImage: "" });
    }
  }, [errors]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxFiles: 1,
    maxSize: 5242880, // 5MB
  });

  const removeImage = () => {
    setKtpImage(null);
    setPreview(null);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!ktpImage) {
      newErrors.ktpImage = "Please upload your KTP image";
    }

    if (!ktpNumber.trim()) {
      newErrors.ktpNumber = "KTP number is required";
    } else if (!/^\d{16}$/.test(ktpNumber)) {
      newErrors.ktpNumber = "KTP number must be 16 digits";
    }

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm() && ktpImage) {
      onNext({ ktpImage, ktpNumber, fullName });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Your KTP (ID Card)
        </h3>
        <p className="text-gray-600">
          Please upload a clear photo of your Indonesian ID card (KTP)
        </p>
      </div>

      {/* Upload Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          KTP Image *
        </label>
        {!preview ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : errors.ktpImage
                ? "border-red-300 bg-red-50"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            <MdCloudUpload className="mx-auto text-5xl text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              {isDragActive
                ? "Drop your KTP image here"
                : "Drag & drop your KTP image here, or click to select"}
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: PNG, JPG, JPEG (Max 5MB)
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative border-2 border-green-500 rounded-xl overflow-hidden"
          >
            <Image
              src={preview}
              alt="KTP Preview"
              width={800}
              height={500}
              className="w-full h-64 object-contain bg-gray-50"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            >
              <MdClose className="text-xl" />
            </button>
            <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm">
              <MdCheckCircle />
              Image uploaded
            </div>
          </motion.div>
        )}
        {errors.ktpImage && (
          <p className="text-red-500 text-sm mt-1">{errors.ktpImage}</p>
        )}
      </div>

      {/* KTP Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          KTP Number (NIK) *
        </label>
        <input
          type="text"
          value={ktpNumber}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").slice(0, 16);
            setKtpNumber(value);
            if (errors.ktpNumber) {
              setErrors({ ...errors, ktpNumber: "" });
            }
          }}
          placeholder="Enter your 16-digit KTP number"
          maxLength={16}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.ktpNumber
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          }`}
        />
        {errors.ktpNumber && (
          <p className="text-red-500 text-sm mt-1">{errors.ktpNumber}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {ktpNumber.length}/16 digits
        </p>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name (as on KTP) *
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (errors.fullName) {
              setErrors({ ...errors, fullName: "" });
            }
          }}
          placeholder="Enter your full name"
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.fullName
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          }`}
        />
        {errors.fullName && (
          <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">📸 Tips for clear KTP photo:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Ensure all text is clearly readable</li>
          <li>Avoid glare and shadows</li>
          <li>Place KTP on a flat, contrasting background</li>
          <li>Make sure the entire card is visible</li>
        </ul>
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Continue to Face Verification
      </button>
    </div>
  );
}
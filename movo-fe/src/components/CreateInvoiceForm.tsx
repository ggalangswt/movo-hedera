"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

interface CreateInvoiceFormProps {
  onBack: () => void;
  onPreview: (data: any, references: any) => void;
  initialData?: any;
  initialReferences?: any[];
}

const currencies = [
  { code: "IDR", name: "Indonesian Rupiah", disabled: false },
  { code: "USD", name: "US Dollar", disabled: true },
  { code: "USDT", name: "Tether", disabled: true },
  { code: "BTC", name: "Bitcoin", disabled: true },
  { code: "ETH", name: "Ethereum", disabled: true },
];

export default function CreateInvoiceForm({
  onBack,
  onPreview,
  initialData,
  initialReferences,
}: CreateInvoiceFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerEmail: initialData?.customerEmail || "",
    customerName: initialData?.customerName || "",
    productName: initialData?.productName || "",
    description: initialData?.description || "",
    amount: initialData?.amount || "",
    currency: initialData?.currency || "IDR",
    referenceKey: "",
    referenceValue: "",
  });

  const [errors, setErrors] = useState({
    customerEmail: "",
    customerName: "",
    productName: "",
    amount: "",
  });

  const [touched, setTouched] = useState({
    customerEmail: false,
    customerName: false,
    productName: false,
    amount: false,
  });

  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [customReferences, setCustomReferences] = useState<
    Array<{ key: string; value: string }>
  >(initialReferences || []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validateField = (field: string, value: string) => {
    let error = "";
    switch (field) {
      case "customerEmail":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!validateEmail(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "customerName":
        if (!value.trim()) {
          error = "Customer name is required";
        } else if (value.trim().length < 2) {
          error = "Customer name must be at least 2 characters";
        }
        break;
      case "productName":
        if (!value.trim()) {
          error = "Product/servise name is required";
        } else if (value.trim().length < 2) {
          error = "Product/servise name must be at least 2 characters";
        }
        break;
      case "amount":
        if (!value.trim()) {
          error = "Amount is required";
        } else if (!/^\d+(\.\d+)?$/.test(value)) {
          error = "Please enter a valid number";
        } else if (parseFloat(value) <= 0) {
          error = "Amount must be greater than zero";
        }
        break;
    }
    return error;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (touched[field as keyof typeof touched]) {
      const error = validateField(field, value);
      setErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
    const value = formData[field as keyof typeof formData];
    const error = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleCurrencySelect = (currency: string, disabled: boolean) => {
    if (!disabled) {
      handleInputChange("currency", currency);
      setIsCurrencyDropdownOpen(false);
    }
  };

  const selectedCurrency = currencies.find((c) => c.code === formData.currency);

  const addCustomReference = () => {
    const key = formData.referenceKey.trim();
    const value = formData.referenceValue.trim();

    if (key && value) {
      // Check if key already exists
      const keyExists = customReferences.some((ref) => ref.key === key);

      if (!keyExists) {
        setCustomReferences((prev) => [
          ...prev,
          {
            key: key,
            value: value,
          },
        ]);
        setFormData((prev) => ({
          ...prev,
          referenceKey: "",
          referenceValue: "",
        }));
      } else {
        // Update existing reference with new value
        setCustomReferences((prev) =>
          prev.map((ref) => (ref.key === key ? { ...ref, value: value } : ref))
        );
        setFormData((prev) => ({
          ...prev,
          referenceKey: "",
          referenceValue: "",
        }));
      }
    }
  };

  const removeCustomReference = (index: number) => {
    setCustomReferences((prev) => prev.filter((_, i) => i !== index));
  };

  const isFieldValid = (field: string) => {
    const value = formData[field as keyof typeof formData];
    const error = errors[field as keyof typeof errors];

    if (!value || !value.toString().trim()) {
      return false;
    }
    if (error) return false;
    if (field === "customerEmail") {
      return validateEmail(value);
    }
    return true;
  };

  const isFormValid = () => {
    const requiredFields = [
      "customerEmail",
      "customerName",
      "productName",
      "amount",
    ];

    return requiredFields.every((field) => {
      const value = formData[field as keyof typeof formData];
      const error = errors[field as keyof typeof errors];
      return value && value.toString().trim() && !error;
    });
  };

  const handlePreview = () => {
    const requiredFields = [
      "customerEmail",
      "customerName",
      "productName",
      "amount",
    ];
    const newErrors: typeof errors = { ...errors };
    const newTouched: typeof touched = { ...touched };
    requiredFields.forEach((field) => {
      newTouched[field as keyof typeof touched] = true;
      const value = formData[field as keyof typeof formData];
      newErrors[field as keyof typeof errors] = validateField(field, value);
    });

    setTouched((prev) => ({
      ...prev,
      ...newTouched,
    }));
    setErrors((prev) => ({
      ...prev,
      ...newErrors,
    }));
    const hasErrors = Object.values(newErrors).some((error) => error !== "");
    if (!hasErrors) {
      onPreview(formData, customReferences);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
        >
          ← Back to Invoices
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Invoice</h1>
        <p className="text-gray-600 mt-1">
          Fill out the invoice details to create a cryptocurrency payment
          request.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          {/* Customer Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) =>
                      handleInputChange("customerEmail", e.target.value)
                    }
                    onBlur={() => handleBlur("customerEmail")}
                    className={`w-full px-4 py-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      touched.customerEmail && errors.customerEmail
                        ? "border-red-500 bg-red-50"
                        : isFieldValid("customerEmail")
                        ? "border-green-500 bg-white"
                        : "border-gray-300 bg-white"
                    }`}
                    placeholder="Enter customer email"
                  />
                  {isFieldValid("customerEmail") && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      ✓
                    </div>
                  )}
                </div>
                {touched.customerEmail && errors.customerEmail ? (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.customerEmail}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Invoice and payment notifications will be sent here.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) =>
                      handleInputChange("customerName", e.target.value)
                    }
                    onBlur={() => handleBlur("customerName")}
                    className={`w-full px-4 py-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      touched.customerName && errors.customerName
                        ? "border-red-500 bg-red-50"
                        : isFieldValid("customerName")
                        ? "border-green-500 bg-white"
                        : "border-gray-300 bg-white"
                    }`}
                    placeholder="Enter customer name"
                  />
                  {isFieldValid("customerName") && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      ✓
                    </div>
                  )}
                </div>
                {touched.customerName && errors.customerName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.customerName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Product Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product/Service Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) =>
                      handleInputChange("productName", e.target.value)
                    }
                    onBlur={() => handleBlur("productName")}
                    className={`w-full px-4 py-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      touched.productName && errors.productName
                        ? "border-red-500 bg-red-50"
                        : isFieldValid("productName")
                        ? "border-green-500 bg-white"
                        : "border-gray-300 bg-white"
                    }`}
                    placeholder="Enter product or service name"
                  />
                  {isFieldValid("productName") && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      ✓
                    </div>
                  )}
                </div>
                {touched.productName && errors.productName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.productName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="relative">
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={4}
                    maxLength={500}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 ${
                      isFieldValid("description")
                        ? "border-green-500 bg-white"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                    {formData.description.length}/500
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Provide additional details about your product or
                  service.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                    onBlur={() => handleBlur("amount")}
                    className={`w-full px-4 py-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      touched.amount && errors.amount
                        ? "border-red-500 bg-red-50"
                        : isFieldValid("amount")
                        ? "border-green-500 bg-white"
                        : "border-gray-300 bg-white"
                    }`}
                    placeholder="0.00"
                  />
                  {isFieldValid("amount") && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      ✓
                    </div>
                  )}
                </div>
                {touched.amount && errors.amount ? (
                  <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the invoice amount.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <div className="relative w-full ">
                  <input
                    type="checkbox"
                    id="currency-dropdown"
                    className="sr-only  peer"
                    checked={isCurrencyDropdownOpen}
                    onChange={(e) =>
                      setIsCurrencyDropdownOpen(e.target.checked)
                    }
                  />
                  <label
                    htmlFor="currency-dropdown"
                    className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-all duration-200 peer-checked:border-blue-500 peer-checked:ring-2 peer-checked:ring-blue-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {selectedCurrency?.code}
                        </span>
                        <span className="text-xs text-gray-500">
                          {selectedCurrency?.name}
                        </span>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                        isCurrencyDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </label>

                  {isCurrencyDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50 animate-dropdown-in">
                      <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {currencies.map((currency, index) => (
                          <button
                            key={currency.code}
                            type="button"
                            onClick={() =>
                              handleCurrencySelect(
                                currency.code,
                                currency.disabled
                              )
                            }
                            disabled={currency.disabled}
                            className={`w-full px-4 py-3 flex items-center justify-between transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                              currency.disabled
                                ? "opacity-60 cursor-not-allowed bg-gray-50"
                                : "hover:bg-blue-50 cursor-pointer active:bg-blue-100"
                            } ${
                              formData.currency === currency.code
                                ? "bg-blue-50 border-l-4 border-l-blue-500"
                                : ""
                            }`}
                            style={{
                              animationDelay: `${index * 30}ms`,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col items-start">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">
                                    {currency.code}
                                  </span>
                                  {currency.disabled && (
                                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                                      Coming Soon
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {currency.name}
                                </span>
                              </div>
                            </div>
                            {formData.currency === currency.code &&
                              !currency.disabled && (
                                <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full animate-scale-in">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Add Custom Reference */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add Custom Reference
            </h2>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference key (e.g., 'order_id')
                </label>
                <input
                  type="text"
                  placeholder="e.g., order_id"
                  value={formData.referenceKey}
                  onChange={(e) =>
                    handleInputChange("referenceKey", e.target.value)
                  }
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference value
                </label>
                <input
                  type="text"
                  value={formData.referenceValue}
                  onChange={(e) =>
                    handleInputChange("referenceValue", e.target.value)
                  }
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={addCustomReference}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <span className="text-lg">+</span>
                </button>
              </div>
            </div>

            {/* Display added references */}
            {customReferences.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Added References:
                </h3>
                <div className="space-y-2">
                  {customReferences.map((ref, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 bg-blue-50 border border-blue-200 p-3 rounded-lg"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium text-blue-900">
                          {ref.key}:
                        </span>
                        <span className="text-sm text-blue-700 ml-2">
                          {ref.value}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomReference(index)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handlePreview}
              disabled={!isFormValid()}
              className={`w-full px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                isFormValid()
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Preview Invoice →
            </button>
            {!isFormValid() && (
              <p className="text-xs text-red-500 mt-2 text-center">
                Please fill in all required fields correctly 
              </p>
            )}
          </div>
        </form>
      </div>

      <style jsx>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
            transition: background 0.2s;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }

          @keyframes scale-in {
            0% {
              transform: scale(0);
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              transform: scale(1);
            }
          }

          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }

          .animate-dropdown-in {
            animation: dropdown-in 0.2s ease-out;
            transform-origin: top;
          }
        `}
      </style>
    </div>
  );
}

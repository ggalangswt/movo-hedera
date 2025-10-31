'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getMerchantProfile, updateMerchantProfile, type MerchantProfile } from '@/utils/api';

interface MerchantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileCompleted?: () => void;
}

export default function MerchantProfileModal({ 
  isOpen, 
  onClose, 
  onProfileCompleted 
}: MerchantProfileModalProps) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
  });

  // Load profile when modal opens
  useEffect(() => {
    if (isOpen && address) {
      loadProfile();
    }
  }, [isOpen, address]);

  const loadProfile = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      const profileData = await getMerchantProfile(address);
      setProfile(profileData);
      
      // Pre-fill form if profile exists
      setFormData({
        name: profileData.name || '',
        businessName: profileData.businessName || '',
        email: profileData.email || '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    // Validate required fields
    if (!formData.name || !formData.businessName || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Updating profile for:', address);
      console.log('Form data:', formData);
      
      const result = await updateMerchantProfile(address, formData);
      console.log('Update result:', result);
      
      // Notify parent component
      if (onProfileCompleted) {
        onProfileCompleted();
      }
      
      onClose();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      console.error('Error details:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {profile?.profileCompleted ? 'Edit Profile' : 'Complete Your Profile'}
          </h2>
          <p className="text-gray-600 mt-1">
            {profile?.profileCompleted 
              ? 'Update your merchant information'
              : 'Please complete your profile to start creating invoices'
            }
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {/* Wallet Address (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wallet Address
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-600 font-mono text-sm">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
              placeholder="e.g. John Doe"
            />
          </div>

          {/* Business Name */}
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
              placeholder="e.g. Netflix Corp"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
              placeholder="e.g. youremail@movo.xyz"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <p className="text-blue-800 text-sm">
              💡 This information will appear on all your invoices and help customers identify your business.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          {profile?.profileCompleted && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                Saving...
              </>
            ) : (
              profile?.profileCompleted ? 'Update Profile' : 'Complete Profile'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


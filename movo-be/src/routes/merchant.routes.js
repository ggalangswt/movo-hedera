import express from 'express';
import { getMerchantProfile, updateMerchantProfile } from '../controllers/merchant.controller.js';

const router = express.Router();

/**
 * @route GET /api/merchants/:walletAddress
 * @desc Get merchant profile by wallet address
 */
router.get('/:walletAddress', getMerchantProfile);

/**
 * @route PUT /api/merchants/:walletAddress
 * @desc Update merchant profile
 */
router.put('/:walletAddress', updateMerchantProfile);

export default router;


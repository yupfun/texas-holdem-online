const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const validateToken = require('../../middleware/auth');
const { getCurrentUser, login } = require('../../controllers/auth');

router.get('/', validateToken, getCurrentUser);

router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  login,
);

/**
 * Wallet ownership verification (future Web3 entry point)
 *
 * Not implemented in this take-home assignment. See:
 *   hiring/candidates/wallet-verification.md
 */
router.post('/wallet/verify', (req, res) => {
  return res.status(501).json({
    message: 'Not implemented; see hiring/candidates/wallet-verification.md',
  });
});

module.exports = router;                                                                                                                                                                                            
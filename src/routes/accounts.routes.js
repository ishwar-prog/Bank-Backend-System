const express = require("express")
const { authMiddleware } = require("../middleware/auth.middleware")
const accountController = require("../controllers/account.controller")  

const router = express.Router();

/**
 * - POST /api/accounts/
 * - Craete a new account
 * - Protected route
 */
router.post("/", authMiddleware, accountController.createAccountController)

/**
 * - GET /api/accounts/
 * - Get all accounts for the authenticated user
 * - Protected route
 */
router.get("/", authMiddleware, accountController.getUserAccountsController)

/**
 * - GET /api/accounts/balance/:accountId
 */
 router.get("/balance/:accountId", authMiddleware, accountController.getAccountBalanceController)


module.exports = router;
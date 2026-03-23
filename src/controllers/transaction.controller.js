const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")

/**
 * -Create a new transactionn
 * The 10-STEP TRANSFER FLOW;
 * 1. Validate request
 * 2.validate idempotency key
 * 3.Check account status
 * 4.derive sender balance from ledger
 * 5.Create transaction (PENDING)]
 * 6.Create DEBIT ledger entry
 * 7.Create CREDIT ledger entry
 * 8.Mark transaction COMPLETED
 * 9.Commit MongoDB session
 * 10.Send email notification
 */


/**
 * 1. Validate request
 */
async function createTransaction(req,res){
    const {fromAccount, toAccount, amount, idempotencyKey} = req.body;

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message: "FromAccount, ToAccount, Amount and IdempotencyKey are required", 
        });
    }

    const fromUserAccount = await accountModel.findOne({
        _id:fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id:toAccount,
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(404).json({
            message: "FromAccount or ToAccount not found",
        });
    }

    /**
     * 2.validate idempotency key
     */
    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status === "COMPLETED"){
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }

        if(isTransactionAlreadyExists.status === "PENDING"){
            return res.status(200).json({
                message: "Transaction is being processed",
            })
        }

        if(isTransactionAlreadyExists.status === "FAILED"){
            return res.status(500).json({
                message: "Previous transaction attempt failed, please try again",
            })
        }

        if(isTransactionAlreadyExists.status === "REVERSED"){
            return res.status(500).json({
                message: "Transaction was reversed, please try again",
            })
        }

    }

    /**
     * 3.Check account status
     */
    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction",
        });
    }

    /**
     * 4.derive sender balance from ledger
     */

}
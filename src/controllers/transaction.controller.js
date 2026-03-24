const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose")

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
    const balance = await fromUserAccount.getbalance()

    if(balance < amount){
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`,
        });
    }

    let transaction;
    try{
    /**
     * 5.Create transaction (PENDING)]
     */
    const session = await mongoose.startSession();
    session.startTransaction()

    transaction = (await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }, {session}))[0]

    const debitLedgerEntry = await ledgerModel.create({
        account: fromAccount,
        amount: amount,
        transactionn: transaction._id,
        type: "DEBIT"
    }, {session})

    await (()=>{
        return new Promise((resolve)=> setTimeout(resolve, 15* 1000))
    })()

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transactionn: transaction._id,
        type: "CREDIT"
    }], {session})

    await transactionModel.findOneAndUpdate(
        {_id: transaction._id},
        {status: "COMPLETED"},
        {session}
    )

    await session.commitTransaction()
    session.endSession()
    }catch(error){
        return res.status(400).json({
            message:"Transaction is pending due to an error, please try again later",
        })
    }
    /**
     * 10.Send email notification
     */
    await emailService.sendTransactionEmail(
        req.user.email,
        req.user.name,
        amount,
        toAccount
    )

    return res.status(201).json({
        message: "Transaction successful",
        transaction
    })
}

async function createInitialFundsTransaction(req,res){
    const {toAccount, amount , idempotencyKey} = req.body;

    if(!toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message: "ToAccount, Amount and IdempotencyKey are required", 
        });
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    });

    if (!toUserAccount) {
        return res.status(404).json({
            message: "Invalid toAccount",
        });
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    });

    if(!fromUserAccount){
        return res.status(404).json({
            message: "System account not found for the user",
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transactionn: transaction._id,
        type: "DEBIT"
    }], {session})

    const creditLedgerEntry = await ledgerModel.create([{
        account: toUserAccount._id,
        amount: amount,
        transactionn: transaction._id,
        type: "CREDIT"
    }], {session})

    transaction.status = "COMPLETED"
    await transaction.save({session})

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction successful",
        transaction
    })   

}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}
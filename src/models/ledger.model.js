const mongoose = require("mongoose")

const ledgerSchema = new mongoose.Schema({
    account:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required:[true, "Account is required"],
        index: true,
        immutable: true
    },
    amount:{
        type: Number,
        required: [true, "Amount is required"],
        immutable: true
    },
    transactionn:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
        required:[true, "Transaction is required"],
        index: true,
        immutable: true
    },
    type:{
        type: String,
        enum:{
            values: ["DEBIT", "CREDIT"],
            message: "Type must be either DEBIT or CREDIT",
        },
        required: [true, "Type is required"],
        immutable: true
    }
})

function preventLedgerModification(){
    throw new Error("Ledger entries cannot be modified or deleted")
}

ledgerSchema.pre("findOneAndUpdate", preventLedgerModification)
ledgerSchema.pre("updateOne", preventLedgerModification)
ledgerSchema.pre("deleteOne", preventLedgerModification)
ledgerSchema.pre("remove", preventLedgerModification)
ledgerSchema.pre("deleteMany", preventLedgerModification)
ledgerSchema.pre("updateMany", preventLedgerModification)
ledgerSchema.pre("findOneAndDelete", preventLedgerModification)
ledgerSchema.pre("findOneAndReplace", preventLedgerModification)

const ledgerModel = mongoose.model("Ledger", ledgerSchema);

module.exports = ledgerModel;
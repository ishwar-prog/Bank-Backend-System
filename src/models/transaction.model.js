const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema({

    fromAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required:[true, "From Account is required"],
        index: true
    },
    toAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required:[true, "To Account is required"],
        index: true

    },
    status:{
        type: String,
        enum:{
            values: ["PENDING", "COMPLETED", "FAILED","REVERSED"],
            message: "Status must be either PENDING, COMPLETED, FAILED or REVERSED",
        },
        default: "PENDING"
    },
    amount:{
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount must be greater than 0"]
    },
    idempotencyKey:{
        type: String,
        required: [true, "Idempotency Key is required"],
        unique: true,
        index: true
    }
},{
    timestamps: true
})

const transactionModel = mongoose.model("Transaction", transactionSchema);

module.exports = transactionModel;
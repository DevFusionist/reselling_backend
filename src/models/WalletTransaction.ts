import mongoose, { Schema } from "mongoose";
const WalletTransactionSchema = new Schema({ resellerId:{type:Schema.Types.ObjectId, ref:"User"}, amount:Number, type:String, description:String }, { timestamps:true });
export default mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", WalletTransactionSchema);

import mongoose, { Schema } from "mongoose";
const OrderSchema = new Schema({ customerId: { type: Schema.Types.ObjectId, ref: "User" }, productId: { type: Schema.Types.ObjectId, ref: "Product" }, resellerId: { type: Schema.Types.ObjectId, ref: "User" }, margin:Number, basePrice:Number, totalAmount:Number, quantity:Number, status:{type:String,default:"pending"}, paymentMeta:Schema.Types.Mixed }, { timestamps:true });
export default mongoose.models.Order || mongoose.model("Order", OrderSchema);

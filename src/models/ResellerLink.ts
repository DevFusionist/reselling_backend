import mongoose, { Schema } from "mongoose";
const SchemaT = Schema;
const ResellerLinkSchema = new Schema({ productId: { type: SchemaT.Types.ObjectId, ref: "Product" }, resellerId: { type: SchemaT.Types.ObjectId, ref: "User" }, margin:Number, token:String }, { timestamps:true });
export default mongoose.models.ResellerLink || mongoose.model("ResellerLink", ResellerLinkSchema);

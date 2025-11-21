import mongoose, { Schema } from "mongoose";
const ProductSchema = new Schema({ title:String, description:String, basePrice:Number, stock:Number }, { timestamps: true });
export default mongoose.models.Product || mongoose.model("Product", ProductSchema);

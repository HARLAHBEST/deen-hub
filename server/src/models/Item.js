import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    lot: { type: String, required: true },
    inv: { type: String, required: true, index: true },
    date: { type: String, required: true },
    desc: { type: String, required: true, index: true },
    bid: { type: Number, required: true },
    cost: { type: Number, required: true },
    cat: { type: String, required: true, index: true },
    status: { type: String, enum: ["In Stock", "Sold", "Lost", "Damaged"], default: "In Stock", index: true },
    hot: { type: Boolean, default: false, index: true },
    customPrice: { type: String, default: "" },
    photoUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

itemSchema.index({ desc: "text", lot: "text", cat: "text", inv: "text" });

export const Item = mongoose.model("Item", itemSchema);

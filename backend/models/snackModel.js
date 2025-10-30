import mongoose from "mongoose";

const snackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ["Vegetarian", "Non Vegetarian", "Juice"],
    },
    img: { type: String, required: true }, // file path or base64 string
  },
  { timestamps: true }
);

export default mongoose.model("Snack", snackSchema);

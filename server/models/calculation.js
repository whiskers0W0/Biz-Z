import mongoose from "mongoose";
export const Calculation = mongoose.model(
  "Calculation",
  new mongoose.Schema(
    {
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      title: { type: String, required: true, maxlength: 100 },
      kind: { type: String, required: true },
      currency: { type: String, required: true },
      inputs: { type: Map, of: Number, required: true },
    },
    { timestamps: true },
  ),
);

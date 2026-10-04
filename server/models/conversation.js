import mongoose from "mongoose";
const message = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    text: { type: String, required: true, maxlength: 12000 },
  },
  { timestamps: true },
);
export const Conversation = mongoose.model(
  "Conversation",
  new mongoose.Schema(
    {
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      title: { type: String, required: true, maxlength: 100 },
      plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan",
        default: null,
      },
      messages: { type: [message], default: [] },
    },
    { timestamps: true, optimisticConcurrency: true },
  ),
);

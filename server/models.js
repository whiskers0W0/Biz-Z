import mongoose from "mongoose";
const sectionSchema = new mongoose.Schema(
  {
    title: String,
    answers: { type: [String], default: [] },
    draft: { type: String, default: "" },
    status: {
      type: String,
      enum: ["not-started", "draft", "reviewed"],
      default: "not-started",
    },
  },
  { _id: false },
);
export const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      name: String,
      email: { type: String, unique: true },
      passwordHash: String,
      profile: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true },
  ),
);
export const Plan = mongoose.model(
  "Plan",
  new mongoose.Schema(
    {
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      name: String,
      description: String,
      sections: [sectionSchema],
      messages: { type: [{ role: String, text: String }], default: [] },
    },
    { timestamps: true },
  ),
);

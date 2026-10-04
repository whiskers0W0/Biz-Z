import mongoose from "mongoose";
const { Schema } = mongoose;
const planRef = {
  type: Schema.Types.ObjectId,
  ref: "Plan",
  required: true,
  index: true,
};
export const BudgetItem = mongoose.model(
  "BudgetItem",
  new Schema(
    {
      plan: planRef,
      name: { type: String, required: true, trim: true, maxlength: 120 },
      category: { type: String, enum: ["startup", "monthly"], required: true },
      amountMinor: {
        type: Number,
        min: 0,
        max: 1e8,
        required: true,
        validate: Number.isSafeInteger,
      },
      quantity: {
        type: Number,
        min: 1,
        max: 10000,
        required: true,
        validate: Number.isSafeInteger,
      },
    },
    { timestamps: true },
  ),
);
export const LaunchTask = mongoose.model(
  "LaunchTask",
  new Schema(
    {
      plan: planRef,
      title: { type: String, required: true, trim: true, maxlength: 160 },
      dueDate: { type: String, required: true, validate:v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v },
      done: { type: Boolean, default: false },
    },
    { timestamps: true },
  ),
);
export const BusinessIdea = mongoose.model(
  "BusinessIdea",
  new Schema(
    {
      slug: { type: String, required: true, unique: true },
      name: { type: String, required: true, maxlength: 120 },
      description: { type: String, required: true, maxlength: 2000 },
      tags: [String],
      skills: [String],
      capital: { type: Number, min: 0, required: true },
      hours: { type: Number, min: 1, max: 168, required: true },
      currency: {
        type: String,
        default: "PHP",
        enum: ["PHP", "USD", "EUR", "GBP", "SGD"],
      },
    },
    { timestamps: true },
  ),
);

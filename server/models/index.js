import mongoose from "mongoose";
const profileSchema=new mongoose.Schema({interests:{type:[String],default:[],validate:a=>a.length===0||(a.length===5&&new Set(a).size===5)},traits:{type:[String],default:[],validate:a=>a.length===0||(a.length===5&&new Set(a).size===5)},workStyles:{type:[String],default:[],validate:a=>a.length<=5},skills:{type:String,maxlength:2000,default:''},hours:{type:Number,min:1,max:168},capital:{type:Number,min:0,max:1e12},monthly:{type:Number,min:0,max:1e12},location:{type:String,maxlength:200,default:''},currency:{type:String,enum:['PHP','USD','EUR','GBP','SGD']}},{_id:false});
const sectionSchema = new mongoose.Schema(
  {
    title: {type:String,required:true,maxlength:120},
    answers: { type: [String], default: [] },
    draft: { type: String, maxlength:30000, default: "" },
    revisions: {
      type: [
        new mongoose.Schema({
          draft: { type: String, default: "" },
          source: String,
          createdAt: { type: Date, default: Date.now },
        }),
      ],
      default: [],
    },
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
      name: { type: String, required: true, trim: true, maxlength: 120 },
      email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        maxlength: 254,
      },
      passwordHash: { type: String, required: true },
      profile: { type: profileSchema, default: () => ({}) },
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
      name: { type: String, required: true, trim: true, maxlength: 120 },
      description: { type: String, maxlength: 2000, default: "" },
      finance: {
        type: new mongoose.Schema(
          {
            currency: {
              type: String,
              enum: ["PHP", "USD", "EUR", "GBP", "SGD"],
              default: "PHP",
            },
            capitalMinor: { validate:Number.isSafeInteger,type: Number, min: 0, max: 1e8, default: 0 },
            priceMinor: { validate:Number.isSafeInteger,type: Number, min: 0, max: 1e8, default: 0 },
            variableMinor: { validate:Number.isSafeInteger,type: Number, min: 0, max: 1e8, default: 0 },
            units: { validate:Number.isSafeInteger,type: Number, min: 0, max: 1e6, default: 0 },
          },
          { _id: false },
        ),
        default: () => ({}),
      },
      idea: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessIdea" },
      sections: [sectionSchema],
      messages: {
        type: [{ role: {type:String,enum:["user","assistant"],required:true}, text: {type:String,maxlength:30000,required:true}, section: {type:Number,min:0,max:7} }],
        default: [],
      },
    },
    { timestamps: true },
  ),
);

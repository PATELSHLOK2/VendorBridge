import mongoose from "mongoose";

const RFQItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit:     { type: String },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);
RFQItemSchema.virtual("id").get(function () { return this._id.toString(); });

const RFQVendorSchema = new mongoose.Schema(
  { vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true } },
  { _id: true }
);

const RFQSchema = new mongoose.Schema(
  {
    rfqNumber:   { type: String, required: true, unique: true },
    title:       { type: String, required: true },
    description: { type: String },
    category:    { type: String },
    deadline:    { type: Date },
    status:      { type: String, enum: ["DRAFT", "PUBLISHED", "CLOSED"], default: "DRAFT" },
    createdById: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items:       { type: [RFQItemSchema], default: [] },
    vendors:     { type: [RFQVendorSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

RFQSchema.virtual("id").get(function () { return this._id.toString(); });

export const RFQ = mongoose.models.RFQ || mongoose.model("RFQ", RFQSchema);

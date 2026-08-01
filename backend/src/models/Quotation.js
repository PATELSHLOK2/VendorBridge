import mongoose from "mongoose";

const QuotationItemSchema = new mongoose.Schema(
  {
    rfqItemId:     { type: mongoose.Schema.Types.ObjectId, required: true },
    unitPrice:     { type: Number, required: true },
    quantity:      { type: Number, required: true },
    taxPercentage: { type: Number, default: 0 },
    totalAmount:   { type: Number, required: true },
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
QuotationItemSchema.virtual("id").get(function () { return this._id.toString(); });

const QuotationSchema = new mongoose.Schema(
  {
    rfqId:            { type: mongoose.Schema.Types.ObjectId, ref: "RFQ", required: true },
    vendorId:         { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    deliveryTimeline: { type: String },
    notes:            { type: String },
    totalAmount:      { type: Number, default: 0 },
    status:           { type: String, enum: ["DRAFT", "SUBMITTED", "SELECTED", "REJECTED"], default: "DRAFT" },
    submittedAt:      { type: Date },
    items:            { type: [QuotationItemSchema], default: [] },
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

QuotationSchema.virtual("id").get(function () { return this._id.toString(); });

// Compound unique index: one quotation per vendor per RFQ
QuotationSchema.index({ rfqId: 1, vendorId: 1 }, { unique: true });

export const Quotation = mongoose.models.Quotation || mongoose.model("Quotation", QuotationSchema);

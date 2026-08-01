import mongoose from "mongoose";

const POItemSchema = new mongoose.Schema(
  {
    itemName:      { type: String, required: true },
    quantity:      { type: Number, required: true },
    unitPrice:     { type: Number, required: true },
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
POItemSchema.virtual("id").get(function () { return this._id.toString(); });

const PurchaseOrderSchema = new mongoose.Schema(
  {
    poNumber:   { type: String, required: true, unique: true },
    approvalId: { type: mongoose.Schema.Types.ObjectId, ref: "Approval" },
    approval:   { type: mongoose.Schema.Types.ObjectId, ref: "Approval" },
    vendorId:   { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    vendor:     { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    rfqId:      { type: mongoose.Schema.Types.ObjectId, ref: "RFQ" },
    rfq:        { type: mongoose.Schema.Types.ObjectId, ref: "RFQ" },
    status:     { type: String, enum: ["ISSUED", "ACKNOWLEDGED", "FULFILLED", "CANCELLED"], default: "ISSUED" },
    issueDate:  { type: Date, default: Date.now },
    createdById:{ type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items:      { type: [POItemSchema], default: [] },
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

PurchaseOrderSchema.virtual("id").get(function () { return this._id.toString(); });

export const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", PurchaseOrderSchema);

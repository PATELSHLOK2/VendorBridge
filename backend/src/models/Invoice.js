import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    poId:          { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },
    vendorId:      { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    vendor:        { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    subtotal:      { type: Number, required: true },
    taxAmount:     { type: Number, required: true },
    grandTotal:    { type: Number, required: true },
    status:        { type: String, enum: ["GENERATED", "SENT", "PAID", "OVERDUE", "CANCELLED"], default: "GENERATED" },
    issuedAt:      { type: Date, default: Date.now },
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

InvoiceSchema.virtual("id").get(function () { return this._id.toString(); });

export const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);

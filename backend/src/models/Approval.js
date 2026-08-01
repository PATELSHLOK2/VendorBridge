import mongoose from "mongoose";

const ApprovalSchema = new mongoose.Schema(
  {
    quotationId:  { type: mongoose.Schema.Types.ObjectId, ref: "Quotation", required: true, unique: true },
    rfqId:        { type: mongoose.Schema.Types.ObjectId, ref: "RFQ", required: true },
    status:       { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    remarks:      { type: String },
    reviewedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt:   { type: Date },
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

ApprovalSchema.virtual("id").get(function () { return this._id.toString(); });

export const Approval = mongoose.models.Approval || mongoose.model("Approval", ApprovalSchema);

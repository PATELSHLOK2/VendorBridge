import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action:   { type: String, required: true },
    module:   {
      type: String,
      enum: ["USER", "VENDOR", "RFQ", "QUOTATION", "APPROVAL", "PURCHASE_ORDER", "INVOICE"],
      required: true,
    },
    entityId: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

ActivityLogSchema.virtual("id").get(function () { return this._id.toString(); });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);

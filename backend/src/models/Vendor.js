import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema(
  {
    vendorName:    { type: String, required: true },
    companyName:   { type: String, required: true },
    contactPerson: { type: String },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:         { type: String },
    address:       { type: String },
    country:       { type: String },
    status:        { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], default: "INACTIVE" },
    createdById:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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

VendorSchema.virtual("id").get(function () {
  return this._id.toString();
});

export const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", VendorSchema);

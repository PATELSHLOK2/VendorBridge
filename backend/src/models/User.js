import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true },
    phone:     { type: String },
    country:   { type: String },
    role:      { type: String, enum: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"], default: "VENDOR" },
    additionalInfo: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

UserSchema.virtual("id").get(function () {
  return this._id.toString();
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);

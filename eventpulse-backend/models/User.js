const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 6, select: false },
  role:       { type: String, enum: ["attendee", "organizer", "admin"], default: "attendee" },
  avatar:     { type: String, default: "" },
  phone:      { type: String, default: "" },
  isVerified: { type: Boolean, default: false },
  createdAt:  { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plain password against hash
UserSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", UserSchema);

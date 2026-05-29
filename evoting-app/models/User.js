import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    voterId: { type: String, required: true, unique: true },
    nationalId: { type: String, required: true, unique: true, trim: true, match: [/^\d{10}$/, 'National ID must be exactly 10 digits'] },
    role: { type: String, enum: ["voter", "admin"], default: "voter" },
    password: { type: String, required: true },
    hasVoted: { type: Boolean, default: false }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});

const User = mongoose.model('User', userSchema);

export default User;
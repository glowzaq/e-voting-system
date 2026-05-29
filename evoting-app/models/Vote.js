import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
    voterId: {
        type: String,
        unique: true,
        required: true,
    },
    candidate: {
        type: String,
        required: true,
    },
});

export default mongoose.model("Vote", voteSchema);
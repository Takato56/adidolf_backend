import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
    {
        userId: { type: Number, required: true },
        token: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true }
    },
    {
        timestamps: true
    }
);

// Automatically delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshTokenModel = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshTokenModel;

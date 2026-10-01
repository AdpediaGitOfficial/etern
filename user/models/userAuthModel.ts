import { Schema, model } from 'mongoose';
import { IUserAuth } from '../../types/user/userTypes';

const userAuthSchema = new Schema<IUserAuth>(
  {
    userId: { type: String, required: true },
    deviceId: { type: String, required: true },
    deviceType: { type: String, required: true },
    authToken: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Every authenticated student request looks up their active sessions by userId, so
// this index keeps that off a collection scan. A user has one record per device
// type, so the authToken comparison happens over a handful of documents.
userAuthSchema.index({ userId: 1, isActive: 1 });

const userAuthModel = model<IUserAuth>('UserAuth', userAuthSchema);
export default userAuthModel;

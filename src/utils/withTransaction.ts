import mongoose from "mongoose";

export const withTransaction = async <T>(
  callback: (session: mongoose.ClientSession) => Promise<T>,
): Promise<T> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);

    await session.commitTransaction();

    session.endSession();
    return result;
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

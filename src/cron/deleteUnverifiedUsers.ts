import UserModel from "../models/User.model";

export const deleteUnverifiedUsers = async () => {
  try {
    const tenMinutes = 10 * 60 * 1000;

    const result = await UserModel.deleteMany({
      emailVerified: false,
      createdAt: { $lt: new Date(Date.now() - tenMinutes) },
    });

    console.log(`Deleted ${result.deletedCount} users`);
  } catch (e) {
    console.log("Error deleting unverified users:", e);
  }
};

import cron from "node-cron";
import { deleteUnverifiedUsers } from "./deleteUnverifiedUsers";

export const startCronJobs = () => {
  cron.schedule("0 * * * *", deleteUnverifiedUsers);
};

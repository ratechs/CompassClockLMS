import mongoose from "mongoose";
import dotenv from "dotenv";
import chalk from "chalk";
import dns from "node:dns";

dotenv.config();

// Workaround for DNS issues on some networks
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoDb = async () => {
  try {
    const uri =
      "mongodb+srv://radigitaltechnologies_db_user:1mtEc33432ihYQfJ@lms.fifpcn0.mongodb.net/?appName=LMS";

    await mongoose.connect(uri);

    console.log(chalk.green("✅ Connected to MongoDB"));
  } catch (error) {
    console.error(chalk.red("❌ Error connecting MongoDB"));
    console.error(error);

    // Re-throw so app startup fails if DB is unavailable
    throw error;
  }
};

export default mongoDb;
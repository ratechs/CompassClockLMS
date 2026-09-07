import mongoose from "mongoose";
import dotenv from "dotenv";
import chalk from "chalk";
import dns from "node:dns";

dotenv.config();

// Custom Google/Cloudflare DNS resolver for shared host environments
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("DNS server override not supported on this host environment");
}

const mongoDb = async () => {
  try {
    const uri =
      process.env.MANGO_DB_URI ||
      "mongodb+srv://radigitaltechnologies_db_user:1mtEc33432ihYQfJ@lms.fifpcn0.mongodb.net/LMS?retryWrites=true&w=majority";

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Fail fast (5s) instead of timing out Passenger (30s+)
      connectTimeoutMS: 10000,
    });

    console.log(chalk.green("✅ Connected to MongoDB"));
  } catch (error) {
    console.error(chalk.red("❌ Error connecting MongoDB:"), error.message);
    // DO NOT re-throw error here. Allow Express app to finish startup and serve HTTP requests.
  }
};

export default mongoDb;
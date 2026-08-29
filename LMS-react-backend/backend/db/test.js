import dns from "node:dns";
import { MongoClient } from "mongodb";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const uri =
  "mongodb+srv://radigitaltechnologies_db_user:1mtEc33432ihYQfJ@lms.fifpcn0.mongodb.net/?appName=LMS";

async function run() {
  try {
    const client = new MongoClient(uri);

    await client.connect();

    console.log("CONNECTED TO MONGODB");

    await client.close();
  } catch (e) {
    console.error(e);
  }
}

run();
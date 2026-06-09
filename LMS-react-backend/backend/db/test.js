import dns from "node:dns";
import { MongoClient } from "mongodb";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const uri =
  "mongodb+srv://admin:beternalAdmin@beternal.vnmk00p.mongodb.net/?appName=Beternal";

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
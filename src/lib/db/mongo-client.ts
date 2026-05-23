import { MongoClient, ServerApiVersion } from "mongodb";

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
  });
  return client.connect();
}

const clientPromise: Promise<MongoClient> =
  global.__mongoClientPromise ?? (global.__mongoClientPromise = createClientPromise());

export default clientPromise;

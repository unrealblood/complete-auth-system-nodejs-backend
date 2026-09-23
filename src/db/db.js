import { MongoClient } from "mongodb";

export async function connectAndGetMongoDbClient() {
    try {
        return await MongoClient.connect(process.env.MONGODB_CONNECTION_URL);
    }
    catch(error) {
        throw new Error(error.message);
    }
}
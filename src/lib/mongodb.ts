import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';

let cachedClient: MongoClient | null = null;
let cachedPromise: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient> {
    if (cachedClient) return cachedClient;

    if (!cachedPromise) {
        cachedPromise = new MongoClient(uri).connect().then((client) => {
            cachedClient = client;
            return client;
        });
    }

    return cachedPromise;
}

export async function getDb(dbName = 'dev') {
    const client = await getMongoClient();
    return client.db(dbName);
}

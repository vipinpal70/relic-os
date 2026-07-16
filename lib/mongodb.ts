import mongoose from "mongoose";
import dns from "dns";

// Fix Node.js DNS resolution issues on Windows when loopback is configured as primary DNS
const currentServers = dns.getServers();
if (currentServers.includes("127.0.0.1") || currentServers.includes("::1")) {
  dns.setServers(["8.8.8.8", "1.1.1.1", "192.168.68.1"]);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global is used here to maintain a cached connection across hot reloads in development.
declare global {
  // eslint-disable-next-line no-var
  var mongooseCached: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCached || { conn: null, promise: null };

if (!global.mongooseCached) {
  global.mongooseCached = cached;
}

export async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log("[dbConnect] Current DNS servers configured in Node:", dns.getServers());
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
      console.log("[dbConnect] Set DNS servers to [8.8.8.8, 1.1.1.1]");
    } catch (err: any) {
      console.error("[dbConnect] Failed to set DNS servers:", err.message);
    }

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

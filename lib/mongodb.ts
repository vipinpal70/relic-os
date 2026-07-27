import mongoose from "mongoose";
import dns from "dns";
import os from "os";

function configureDNS() {
  if (typeof dns === "undefined" || typeof dns.getServers !== "function" || typeof dns.setServers !== "function") {
    return;
  }
  try {
    const current = dns.getServers();
    const candidates: string[] = [];
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === "IPv4" && !net.internal) {
          const parts = net.address.split(".");
          parts[3] = "1";
          const gw = parts.join(".");
          if (!candidates.includes(gw)) {
            candidates.push(gw);
          }
        }
      }
    }
    const validCurrent = current.filter((s) => s !== "127.0.0.1" && s !== "::1");
    const fallbackPublic = ["8.8.8.8", "1.1.1.1"];
    const dnsList = Array.from(new Set([...candidates, ...validCurrent, ...fallbackPublic]));
    dns.setServers(dnsList);
    console.log("[dbConnect] Configured DNS servers:", dnsList);
  } catch (err: any) {
    console.warn("[dbConnect] Failed to set DNS servers:", err.message);
  }
}

// Configure DNS at file initialization
configureDNS();

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

    configureDNS();

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


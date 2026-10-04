import "dotenv/config";
import dns from "node:dns";
import mongoose from "mongoose";
import { app } from "./app.js";
export { app };
if (process.env.DNS_SERVERS?.trim())
  dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
if (process.env.NODE_ENV !== "test") {
  app.listen(process.env.PORT || 3001, "127.0.0.1", () =>
    console.log("Biz-Z API listening"),
  );
  if (process.env.MONGO_URI || process.env.MONGODB_URI) {
    let attempts = 0;
    const connectDatabase = async () => {
      try {
        await mongoose.connect(
          process.env.MONGO_URI || process.env.MONGODB_URI,
          {
            serverSelectionTimeoutMS: 10000,
          },
        );
        attempts = 0;
        console.log("MongoDB connected");
      } catch (error) {
        attempts += 1;
        const codes = [error.code, error.cause?.code];
        for (const server of error.reason?.servers?.values() || []) {
          codes.push(server.error?.code, server.error?.cause?.code);
        }
        const hint = codes.includes("ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR")
          ? "TLS handshake rejected. Check Atlas cluster status and the current public IP in Network Access; also check VPN/firewall settings."
          : codes.includes(18)
            ? "Database authentication failed. Check the database username and password."
            : codes.some(code => ["ENOTFOUND", "ETIMEOUT", "EAI_AGAIN", "ECONNREFUSED"].includes(code))
              ? "DNS/network lookup failed. Check your connection and DNS settings."
              : "Server connection failed. Check Atlas status, network access and connection settings.";
        const delay = Math.min(5000 * 2 ** Math.min(attempts - 1, 4), 60000);
        console.warn(`MongoDB unavailable. ${hint} Retrying in ${delay / 1000}s.`);
        setTimeout(connectDatabase, delay).unref();
      }
    };
    void connectDatabase();
  }
}

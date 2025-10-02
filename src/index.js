 import dns from 'dns';
import dotenv from 'dotenv';
import app from "./app.js";
import connectDB from "./db/index.js";

 dotenv.config({
     path: './config/config.env'
 });

 // Prefer IPv4 first to avoid SRV/DNS issues on some networks
 try {
     dns.setDefaultResultOrder('ipv4first');
     dns.setServers(['8.8.8.8', '1.1.1.1']);
 } catch {}

 connectDB()
     .then(() => {
         const PORT = process.env.PORT || 8000;
         app.listen(PORT, () => {
             console.log(`Server running on port ${PORT}`);
         });
     })
     .catch((error) => {
         console.error(`Error: ${error.message}`);
         process.exit(1);
     });
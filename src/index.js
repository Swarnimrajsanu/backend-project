 import dns from 'dns';
 import dotenv from 'dotenv';
 import connectDB from "./db/index.js";

 dotenv.config({
     path: './config/config.env'
 });

 // Prefer IPv4 first to avoid SRV/DNS issues on some networks
 try {
     dns.setDefaultResultOrder('ipv4first');
     dns.setServers(['8.8.8.8', '1.1.1.1']);
 } catch {}

 connectDB();
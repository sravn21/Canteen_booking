const mongoose = require("mongoose");
require("dotenv").config();

const findData = async () => {
    try {
        const mongoUrl = "mongodb://127.0.0.1:27017";
        const client = await mongoose.connect(mongoUrl);
        const admin = client.connection.db.admin();
        const dbs = await admin.listDatabases();
        
        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (["admin", "config", "local"].includes(dbName)) continue;

            const db = client.connection.client.db(dbName);
            const collections = await db.listCollections().toArray();
            
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                if (count > 0) {
                    console.log(`DB: ${dbName} | Collection: ${col.name} | Count: ${count}`);
                    if (col.name === "users" || col.name === "User") {
                        const sample = await db.collection(col.name).findOne();
                        console.log("  Sample User:", JSON.stringify(sample).substring(0, 100));
                    }
                }
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

findData();

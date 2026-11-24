const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (uri) {
    await mongoose.connect(uri, {
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 50),
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
      maxIdleTimeMS: Number(process.env.MONGO_MAX_IDLE_TIME_MS || 60000),
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000),
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
      waitQueueTimeoutMS: Number(process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS || 10000),
    });
    console.log('MongoDB connected to Atlas/local URI');
    return;
  }

  memoryServer = await MongoMemoryServer.create();
  const memoryUri = memoryServer.getUri();
  await mongoose.connect(memoryUri, {
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
    serverSelectionTimeoutMS: 10000,
  });
  console.log(`MongoDB connected to in-memory server: ${memoryUri}`);
};

const closeDB = async () => {
  if (memoryServer) {
    await memoryServer.stop();
  }
  await mongoose.disconnect();
};

module.exports = { connectDB, closeDB };

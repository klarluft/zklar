require("dotenv").config();

import express from "express";
import { z } from "zod";
import { mongodbClient } from "./mongodb";
import { test } from "./test";

const app = express();

app.use(express.json());

async function run() {
  try {
    await mongodbClient.connect();
    await mongodbClient.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    await test();
  } finally {
    await mongodbClient.close();
  }
}

run();

// =================================================================================================
// SHUTDOWN HANDLING
// =================================================================================================

function gracefulShutdown() {
  console.log("Received termination signal, closing MongoDB connection...");

  mongodbClient
    .close(false) // `false` ensures an immediate close (won't wait for queued requests)
    .then(() => {
      console.log("MongoDB connection closed.");
      process.exit(0); // Exit process cleanly
    })
    .catch((err) => {
      console.error("Error while closing MongoDB connection", err);
      process.exit(1); // Exit with failure
    });
}

// Capture various shutdown signals and events
process.on("SIGINT", gracefulShutdown); // Handle Ctrl+C
process.on("SIGTERM", gracefulShutdown); // Handle kill command

// Handle uncaught exceptions to prevent crashes
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown(); // Perform cleanup before shutting down
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown();
});

import express from "express";
import dotenv, { config } from "dotenv";
import databaseConnection from "./config/database.js";
import cookieParser from "cookie-parser";
import userRoute from "./routes/userRoutes.js";
import tweetRoute from "./routes/tweetRoute.js";
import cors from "cors";
dotenv.config({
  path: ".env",
});
databaseConnection();
const app = express();

//middleware
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: true,
  credentials: true,
};
app.use(cors(corsOptions));

//api
app.get("/", (req, res) => {
  res.send("Backend is running successfully!");
});
app.use("/api/v1/user", userRoute);
app.use("/api/v1/tweet", tweetRoute);

if (process.env.NODE_ENV !== 'production') {
  app.listen(process.env.PORT || 8080, () => {
    console.log(`server listen at port ${process.env.PORT || 8080}`);
  });
}

export default app;

//filepath: d:\tecnologias-emergentes-001\src\server.js
import http from "node:http";
import app from "./app.js";
import dotenv from "dotenv";
import connectRabbit from "./services/connectRabbit.js";

dotenv.config();

const error = (err) => {
  console.error(`An error has occurred on start server\n ${err.message}`);
  throw err;
};

const listening = async () => {
  console.log(`Server running on port ${process.env.PORT}`);
  await connectRabbit();
};

const server = http.createServer(app);
server.listen(process.env.PORT || 3000);
server.on("error", error);
server.on("listening", listening);
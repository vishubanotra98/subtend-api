import "./config/env.js";
import "./workers/email.worker.js";
import "./workers/deletion.worker.js";
import app, { server } from "./app.js";
import { PORT } from "./constants/constant.js";
import { initWebSocketServer } from "./services/socket.service.js";

initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server is running on PORT : ${PORT}`);
});

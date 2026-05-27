import "./config/env.js";
import { server } from "./app.js";
import { io } from "./app.js";
import { PORT } from "./constants/constant.js";

io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);
});

server.listen(PORT, () => {
  console.log(`Server is running on PORT : ${PORT}`);
});

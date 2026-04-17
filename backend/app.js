require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");

const app = express();
const paymentRoutes = require("./src/routers/paymentRoutes");

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));
app.use("/payment", paymentRoutes);
app.use("/auth", require("./src/routers/authRouter.js"));
console.log("Auth routes mounted at /auth");

const db = require("./src/utils/db.js");
db();

app.use("/user", require("./src/routers/userRouter.js"));
app.use("/property", require("./src/routers/propertyRouter.js"));
app.use("/booking", require("./src/routers/bookingRouter.js"));
app.use("/message", require("./src/routers/messageRouter.js"));
app.use("/notification", require("./src/routers/notificationRouter.js"));
app.use("/wishlist", require("./src/routers/Wishlistrouter.js"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST", "PATCH"] },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(String(userId));
    console.log("User joined room:", userId);
  });

  socket.on("sendMessage", ({ receiverId, message }) => {
    io.to(String(receiverId)).emit("getMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = (port) => {
  server
    .listen(port, () => {
      console.log(`Server started at port ${port}`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        const nextPort = port + 1;
        console.log(`Port ${port} busy, trying ${nextPort}...`);
        startServer(nextPort);
      } else {
        console.error(err);
      }
    });
};

startServer(PORT);

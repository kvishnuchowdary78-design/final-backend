const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { Worker } = require('worker_threads');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const Activity = require('./models/Activity');
const redis = require('./redisClient');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(helmet());

// ---------------- DB ----------------
mongoose.connect('mongodb://127.0.0.1:27017/activityDB')
  .then(() => console.log("MongoDB connected"));

// ---------------- RATE LIMIT ----------------
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5
});

app.use('/login', limiter);

// ---------------- SOCKET ----------------
io.on('connection', (socket) => {
  console.log("User connected:", socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    io.to(room).emit('msg', `User joined ${room}`);
  });

  socket.on('disconnect', () => {
    console.log("User disconnected");
  });
});

// ---------------- ROUTES ----------------

// Test route
app.get('/test', (req, res) => {
  res.send("Server running");
});

// Create activity
app.post('/activity', async (req, res) => {
  const a = new Activity(req.body);
  await a.save();
  res.json(a);
});

// Get activities (CACHE)
app.get('/activities', async (req, res) => {
  const cache = await redis.get('activities');

  if (cache) {
    console.log("From cache");
    return res.json(JSON.parse(cache));
  }

  const data = await Activity.find();
  await redis.set('activities', JSON.stringify(data), 'EX', 60);

  res.json(data);
});

// Register (race condition)
app.post('/register/:id', async (req, res) => {
  const a = await Activity.findById(req.params.id);

  if (!a) return res.send("Not found");

  if (a.bookedSeats >= a.maxSeats)
    return res.send("Full");

  a.bookedSeats++;
  await a.save();

  await redis.del('activities');

  io.emit('joined', a.name);

  // Worker thread
  const worker = new Worker('./worker.js', {
    workerData: { num: 40 }
  });

  worker.on('message', (result) => {
    console.log("Worker result:", result);
  });

  res.send("Registered");
});

// Login route (for rate limit test)
app.post('/login', (req, res) => {
  res.send("Login success");
});

// ---------------- SERVER ----------------
server.listen(5000, () => {
  console.log("Server running on 5000");
});
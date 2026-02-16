#  Real-Time Chat Application

A modern, full-stack chat application with **instant messaging**, **real-time notifications**, and **online status tracking** — built with React, Node.js, Express, MongoDB, and Socket.io.

##  What It Does

- **Sign up & Login** → Secure auth with JWT + password hashing
- **User List** → See all available users (except yourself)
- **Real-Time Chat** → Send/receive messages instantly without page refresh
- **Online Status** → Know who's online, who's offline
- **Message History** → Previous conversations persist in database
- **Optimistic Updates** → Messages appear instantly like WhatsApp

##  Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 19 + Vite + Socket.io-client + Axios |
| **Backend** | Node.js + Express + Socket.io |
| **Database** | MongoDB |
| **Auth** | JWT + bcryptjs |
| **Real-Time** | Socket.io (bidirectional communication) |

##  Project Structure

```
Chat-App/
├── backend/
│   ├── src/
│   │   ├── config/db.js                 # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js        # Register & Login
│   │   │   ├── messageController.js     # Send & Fetch messages
│   │   │   └── userController.js        # User profile & list
│   │   ├── middleware/authMiddleware.js # JWT verification
│   │   ├── models/
│   │   │   ├── User.js                  # User schema
│   │   │   └── Message.js               # Message schema
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── messageRoutes.js
│   │   │   └── userRoutes.js
│   │   └── socket/socketHandler.js      # Real-time events
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/axios.js                 # API client with JWT
    │   ├── context/
    │   │   ├── AuthContext.jsx          # Auth state
    │   │   └── ChatContext.jsx          # Messages & online users
    │   ├── components/
    │   │   └── Chat/
    │   │       ├── ChatWindow.jsx       # Main chat UI
    │   │       ├── ChatList.jsx         # User list
    │   │       ├── MessageInput.jsx     # Message input
    │   │       └── ...
    │   ├── socket/socket.js             # Socket.io client
    │   ├── pages/Dashboard.jsx          # Main page
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    └── package.json
```

##  Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas URI)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
echo "MONGO_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your_jwt_secret_key_here
PORT=5000" > .env

# Start server
npm start
# ✓ Runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# ✓ Runs on http://localhost:5173
```

Open **http://localhost:5173** in browser → Ready to chat! 

##  API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login & get JWT token

### Users
- `GET /api/users/me` — Your profile
- `GET /api/users/` — All users (except you)
- `GET /api/users/online` — Online users list
- `PUT /api/users/update` — Update profile

### Messages
- `POST /api/chat` — Send message
- `GET /api/chat/:userId` — Fetch chat history

##  Socket Events

### Client → Server
```javascript
socket.emit("join", userId)              // Join user room
socket.emit("sendMessage", messageData)  // Send via socket
```

### Server → Client
```javascript
socket.on("receiveMessage", message)     // New message
socket.on("userOnline", {userId, ...})   // User came online
socket.on("userOffline", {userId, ...})  // User went offline
socket.on("onlineUsersList", userIds)    // Online users list
```

##  How It Works (Message Flow)

```
User A sends "Hello" to User B
              ↓
   1️⃣ Message appears INSTANTLY in UI (optimistic update)
              ↓
   2️⃣ Backend saves to MongoDB + emits via Socket.io
              ↓
   3️⃣ User B gets socket event → message appears in their UI
              ↓
   4️⃣ All without page refresh 
```

### Key Features

**1. Optimistic Updates**
- Message shows instantly while API request is in-flight
- Prevents the "message disappears until response" problem

**2. Real-Time Socket Sync**
- Both REST API AND Socket.io work together
- REST API saves to DB, Socket emits for instant delivery

**3. Smart Duplicate Prevention**
- Detects if message already in UI (optimistic)
- Replaces with real data from server
- Prevents showing same message twice

**4. Online Status**
- Server tracks connected users
- Broadcasting status changes to all clients
- UI shows green/red indicator

##  Security

✅ **JWT Authentication** — Every request verified
✅ **Password Hashing** — bcryptjs (12 rounds)
✅ **Socket Auth** — JWT verified on connection
✅ **CORS Enabled** — Frontend-Backend communication safe

##  Frontend State Management

### AuthContext
```javascript
{
  user: { _id, name, email, profilePic },
  isAuthenticated: true,
  token: "jwt_token_here"
}
```

### ChatContext
```javascript
{
  messages: [...],              // Messages for active chat
  activeChat: { user object },  // Current chat partner
  onlineUsers: Set([userIds])   // Online users
}
```

##  UI/UX Details

- **Sending Indicator** →  Shows while message is being sent
- **Checkmark** → ✓ Shows when message is confirmed
- **Loading States** → Chat history loading
- **Error Handling** → Toast notifications for errors
- **Auto-scroll** → Messages scroll to bottom automatically

##  Troubleshooting

**Messages not appearing?**
- Check browser console (F12)
- Verify backend is running on port 5000
- Check MongoDB connection in .env

**Socket not connecting?**
- Ensure CORS is enabled in backend
- Check JWT token in localStorage
- Verify server.js has `app.locals.io = io`

**Login failing?**
- Check MONGO_URI in .env
- Ensure user exists with correct password
- Check JWT_SECRET is set

**Made with  for real-time communication**

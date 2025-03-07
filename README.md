# Thought Matching Game

A multiplayer game where players match thoughts using Socket.IO for real-time communication.

## Deploying to Render

You have two options for deploying your Socket.IO server on Render:

### Option 1: Deploy as a Single Next.js App (Recommended for simplicity)

With this option, the Socket.IO server runs inside the Next.js API route.

1. Create a Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: thought-matching-game
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT`: 3000 (or any port Render assigns)

4. Click "Create Web Service"

### Option 2: Deploy Separate Frontend and Socket.IO Server

This option gives you more control and scalability by running the Socket.IO server separately.

#### 1. Deploy the Socket.IO Server

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: thought-matching-game-socket
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**:
     - `PORT`: 10000 (or any port Render assigns)
     - `FRONTEND_URL`: URL of your frontend app (e.g., https://your-frontend-app.onrender.com)

4. Click "Create Web Service"

#### 2. Deploy the Next.js Frontend

1. Create another Web Service on Render
2. Connect the same GitHub repository
3. Configure the service:
   - **Name**: thought-matching-game-frontend
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NEXT_PUBLIC_SOCKET_URL`: URL of your Socket.IO server (e.g., https://thought-matching-game-socket.onrender.com)

4. Click "Create Web Service"

## Using Render Blueprint (render.yaml)

For easier deployment, you can use the included `render.yaml` file:

1. Fork this repository
2. Go to your Render dashboard
3. Click "New" and select "Blueprint"
4. Connect your forked repository
5. Render will automatically create both services

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Start the Next.js development server (includes Socket.IO in API route):
   ```
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

4. (Optional) If you want to run the standalone Socket.IO server:
   ```
   node server.js
   ``` 
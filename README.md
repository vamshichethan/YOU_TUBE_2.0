# YourTube 2.0 - Video Streaming Platform

A modern YouTube clone built with Next.js, Express, and MongoDB. This project features full-stack functionality including video uploading, user channels, watch history, and real-time interactions.

## 🚀 Features

- **Video Management**: Upload MP4 videos with custom titles and automatic channel association.
- **User Channels**: Create and personalize your own channel with descriptions.
- **Interactions**: Like, dislike, and comment on videos.
- **Organization**: "Watch Later" and "Liked Videos" playlists.
- **Personalization**: Interactive Sidebar tailored to logged-in users.
- **Search**: Dynamic search functionality find videos and channels.
- **History**: Keep track of everything you've watched, with the ability to manage your history.
- **Modern UI**: Built with Shadcn UI and Tailwind CSS for a premium, responsive look.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (Pages Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Auth**: [Firebase](https://firebase.google.com/) (Google Sign-In)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via Mongoose
- **File Handling**: Multer for local video storage

## 🏗️ Getting Started

### Prerequisites
- Node.js installed on your machine.
- MongoDB running locally (usually on `localhost:27017`).
- Firebase project credentials for Google Authentication.

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd you_tube2.0
   ```

2. **Setup the Backend**:
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   DB_URL=mongodb://localhost:27017/youtube_clone
   ```

3. **Setup the Frontend**:
   ```bash
   cd ../yourtube
   npm install
   ```
   Create a `.env.local` file in the `yourtube` directory:
   ```env
   BACKEND_URL=http://localhost:5000
   ```

### Running the Project

1. **Start the Backend**:
   From the `server` directory:
   ```bash
   npm start
   ```

2. **Start the Frontend**:
   From the `yourtube` directory:
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```text
├── server/               # Express backend
│   ├── controllers/      # Route handlers
│   ├── Modals/           # Mongoose models (Auth, Video, Comment, etc.)
│   ├── routes/           # Express routes
│   └── uploads/          # Stored video files
└── yourtube/             # Next.js frontend
    ├── src/
    │   ├── components/   # UI components
    │   ├── lib/          # Context and utilities (Auth, Axios)
    │   └── pages/        # Next.js pages
```

## 📝 License

This project is open-source and available under the [ISC License](https://opensource.org/licenses/ISC).

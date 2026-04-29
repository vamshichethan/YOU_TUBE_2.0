# YourTube 2.0

A full-stack video streaming platform inspired by YouTube, built with **Next.js**, **Express**, **MongoDB**, and **Socket.IO**.  
YourTube combines video publishing, premium viewing plans, downloads, real-time video calls, smart theming, gesture controls, and multilingual commenting into one production-ready platform.

## Live Demo

- Frontend: [https://yourtube-frontend-pzny.onrender.com](https://yourtube-frontend-pzny.onrender.com)
- Backend: [https://yourtube-backend-i6tv.onrender.com](https://yourtube-backend-i6tv.onrender.com)

## Highlights

- Video upload, watch, search, and channel management
- Watch history, liked videos, watch later, and downloads
- Premium plans with Razorpay test payments
- Tiered watch-time access for Free, Bronze, Silver, and Gold users
- Real-time video calling with screen sharing and recording
- Gesture-based custom video controls
- Region-aware automatic theming and OTP login behavior
- Multilingual comments with translation and moderation rules

## Core Features

### 1. Video Platform
- Upload and stream MP4 videos
- Browse videos on home and explore pages
- Search videos and channels
- Related videos and next-video navigation
- Create and manage user channels

### 2. User Features
- Sign in with Google or OTP flow
- View watch history
- Save videos to watch later
- Like videos
- Download videos
- Access downloaded videos from the profile area

### 3. Premium Plans
YourTube includes a plan upgrade system with **Razorpay test payments**:

- **Free**: 5 minutes watch time per video, 1 download per day
- **Bronze**: INR 10, 7 minutes watch time
- **Silver**: INR 50, 10 minutes watch time
- **Gold**: INR 100, unlimited watch time

After successful payment:
- User plan is upgraded
- Invoice details are generated
- Confirmation email is sent

### 4. Downloads
- Users can download videos directly from the watch page
- Downloaded videos appear in the **Downloads** section
- Free users are limited to **1 download per day**
- Premium users get unlimited download access

### 5. Real-Time Calling
- In-app video calling using WebRTC + Socket.IO
- Join calls via room link / call code
- Share screen during calls
- Share a YouTube tab for co-viewing
- Record sessions and save locally as `.webm`

### 6. Gesture-Based Player Controls
Custom player interactions include:
- Double tap right: seek forward 10 seconds
- Double tap left: seek backward 10 seconds
- Single tap center: pause/resume
- Triple tap center: next video
- Triple tap left: open comments
- Triple tap right: exit website flow

### 7. Smart Theme and Regional Auth
The platform changes behavior based on **time** and **location**:
- If the user is in **South India** and logs in between **10:00 AM and 12:00 PM IST**, the site uses a **light theme**
- Otherwise, the site uses a **dark theme**

OTP authentication also changes by region:
- **South India**: OTP sent to email
- **Other regions**: OTP sent to mobile number

### 8. Comment System
- Users can post comments in any language
- Translate comments into selected languages
- Like and dislike comments
- Display city context for each comment
- Block comments containing unsupported special characters
- Auto-remove comments after **2 dislikes from other users**

## Tech Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI
- Lucide React
- Firebase Auth
- Axios
- Socket.IO Client

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- Socket.IO
- Multer
- Nodemailer
- Razorpay
- Twilio

### Deployment
- Vercel for frontend
- Render for backend

## Project Structure

```text
YOU_/
├── server/
│   ├── controllers/
│   ├── lib/
│   ├── Modals/
│   ├── routes/
│   ├── uploads/
│   └── index.js
├── yourtube/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
└── README.md
```

## Local Setup

### Prerequisites
- Node.js
- MongoDB
- Firebase project
- Razorpay test account
- SMTP credentials
- Twilio credentials

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd YOU_
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file inside `server/`:

```env
PORT=5000
DB_URL=mongodb://127.0.0.1:27017/yourtube

SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email
SMTP_PASS=your-password
OTP_FROM_EMAIL=no-reply@yourtube.local
SHOW_DEV_OTP=true

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
TWILIO_MESSAGING_SERVICE_SID=
OTP_DEFAULT_COUNTRY_CODE=+91

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

FRONTEND_URL=http://localhost:3000
```

Run backend:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../yourtube
npm install
```

Create a `.env.local` file inside `yourtube/`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000
```

Run frontend:
```bash
npm run dev
```

Open:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Important Workflows

### OTP Login
- Region is detected server-side
- South India users receive email OTP
- Other users receive mobile OTP

### Premium Upgrade
- User hits plan limit
- Premium modal opens
- Payment is completed in Razorpay test mode
- Plan is updated
- Invoice email is sent

### Downloads
- Download from watch page
- Download history stored in backend
- Downloads visible in Downloads page

### Calling
- Create or join a call room
- Use webcam/mic
- Share screen or YouTube tab
- Record and download the session locally

## API Areas

Main backend route groups:
- `/user` - auth, OTP, profile, plan-related user data
- `/video` - video upload and listing
- `/comment` - comments, likes, dislikes, translation
- `/download` - download requests and history
- `/payment` - Razorpay order/verification
- `/history` - watch history
- `/watch` - watch later
- `/like` - liked videos

## Production Notes

- Frontend and backend are deployed separately on Vercel and Render
- CORS is configured for deployed frontend/backend communication
- OTP and invoice email flows require valid SMTP configuration
- SMS OTP requires Twilio configuration
- Razorpay is configured for test payments initially

## Why This Project Stands Out

YourTube is more than a basic YouTube clone. It combines:
- premium monetization
- region-aware authentication
- adaptive theming
- gesture-driven UX
- real-time collaboration
- multilingual accessibility
- moderation-focused commenting

This makes it a strong full-stack project demonstrating both **product thinking** and **engineering depth**.

## Future Improvements
- Admin dashboard for moderation and analytics
- Better recommendation engine
- Notifications system
- TURN server for stronger WebRTC connectivity
- Cloud storage for uploaded videos
- Better invoice/download export history

## Author

Built by **Vamshi Chethan**

## License

This project is licensed under the **ISC License**.

15:52



# YourTube 2.0

A full-stack YouTube-inspired video platform built with **Next.js**, **Node.js**, **Express**, **MongoDB**, **Socket.IO**, and **Razorpay**, designed to go beyond a normal video-clone by combining:

- real-time **video calling**
- **screen sharing**
- **call recording**
- **downloads with premium limits**
- **plan-based watch restrictions**
- **gesture-controlled video playback**
- **location + time aware theming**
- **region-based OTP authentication**
- **multilingual comments with translation**
- **automatic moderation rules**

This project was built to simulate a modern social video platform where users can not only watch content, but also interact, collaborate, and personalize their experience in a smart way.

---

# Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Advanced Product Features](#advanced-product-features)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Frontend Features](#frontend-features)
- [Backend Features](#backend-features)
- [Authentication Flow](#authentication-flow)
- [Theme Logic](#theme-logic)
- [Plan System](#plan-system)
- [Download System](#download-system)
- [Video Calling System](#video-calling-system)
- [Gesture Control System](#gesture-control-system)
- [Comment System](#comment-system)
- [Payment and Invoice Flow](#payment-and-invoice-flow)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [How to Run Locally](#how-to-run-locally)
- [Screens / User Journey](#screens--user-journey)
- [API Overview](#api-overview)
- [Testing Notes](#testing-notes)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Why This Project Stands Out](#why-this-project-stands-out)
- [Author](#author)

---

# Project Overview

**YourTube 2.0** is not just a clone of a video platform. It is an enhanced full-stack social media experience that combines content consumption, premium monetization, and real-time communication in one place.

Users can:

- browse and watch videos
- like videos
- save videos for watch later
- track watch history
- download videos
- view downloaded videos in a dedicated section
- upgrade plans using Razorpay
- join video calls with friends
- share screen during calls
- record calls and save recordings locally
- use smart gestures on the video player
- log in using region-based OTP authentication
- experience automatic theme switching based on time and South India location logic
- interact through multilingual comments with translation and moderation

This project demonstrates strong integration of **frontend UX**, **backend logic**, **real-time systems**, **payments**, and **context-aware personalization**.

---

# Tech Stack

## Frontend
- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Radix UI**
- **Lucide Icons**
- **Axios**
- **Firebase Authentication**

## Backend
- **Node.js**
- **Express**
- **MongoDB**
- **Mongoose**
- **Socket.IO**
- **Nodemailer**
- **Razorpay**
- **JWT middleware**
- **Mongo Memory Server** fallback for deployment/testing

## Deployment
- **Vercel** for frontend
- **Render** for backend

---

# Core Features

## Video Platform Core
- Video listing
- Watch page
- Related videos
- Explore page
- Subscriptions page
- Watch history
- Liked videos
- Watch later
- Downloads section
- Channel support

## Authentication
- Google sign-in
- OTP login
- Region-based OTP channel selection
- Email OTP for South India
- Mobile OTP for non-South India

## Premium System
- Plan upgrade modal
- Razorpay payment integration
- Payment verification
- Invoice email generation
- Plan-based watch time restriction
- Premium download unlock

## Real-Time Communication
- 1-to-1 video calling
- WebRTC call setup
- Socket.IO signaling
- Screen sharing
- Local call recording

## Smart UX
- Dynamic theme switching
- Gesture-controlled video player
- Translatable comments
- City-tagged comments
- Auto moderation

---

# Advanced Product Features

# 1. Context-Aware Theme System

The platform automatically changes theme based on:

- **time in IST**
- **user location**

### Rule
If:
- time is between **10:00 AM and 12:00 PM IST**
- and region is one of:
  - Tamil Nadu
  - Kerala
  - Karnataka
  - Andhra Pradesh
  - Telangana

Then:
- apply **light theme**

Else:
- apply **dark theme**

This creates a localized and context-aware UI experience.

---

# 2. Region-Based Authentication

Authentication changes based on the user’s region.

### South India
- OTP sent to **registered email**

### Other Regions
- OTP sent to **registered mobile number**

This makes login personalized and region-aware.

---

# 3. Video Download with Premium Restriction

Users can download videos directly from the platform.

### Free Plan
- only **1 video download per day**

### Bronze / Silver / Gold
- **unlimited downloads**

Downloaded videos appear inside the **Downloads** section in the user account area.

---

# 4. Tier-Based Watch Time Access

Users have a plan-based maximum watch time per video.

### Free Plan
- 5 minutes

### Bronze Plan
- 7 minutes

### Silver Plan
- 10 minutes

### Gold Plan
- unlimited

When the limit is reached:
- video pauses
- upgrade modal appears
- user can purchase a higher plan

---

# 5. Video Calling + Collaboration

Users can start a call and invite friends by sharing the room link.

During the call:
- both users can see each other
- screen sharing is available
- YouTube tab sharing is supported
- local session recording is available
- recording file is downloaded to the user’s device

This turns the platform into a collaborative media-sharing experience.

---

# 6. Gesture-Based Video Controls

The custom video player supports smart gesture interactions.

### Double Tap Left
- rewind 10 seconds

### Double Tap Right
- forward 10 seconds

### Single Tap Center
- play / pause

### Triple Tap Center
- go to next video

### Triple Tap Left
- open comments section

### Triple Tap Right
- close / exit player

This gives the player a native app-like viewing experience.

---

# 7. Smart Comment System

Comments are more than plain text.

### Supported features
- multilingual comments
- translation button
- like / dislike on comments
- city display on each comment
- special-character blocking
- auto deletion after 2 dislikes

### Moderation rules
- comments with disallowed special characters are rejected
- if a comment gets **2 dislikes**, it is automatically removed

---

# Architecture

## Frontend
The frontend is built in Next.js and is responsible for:
- UI rendering
- state handling
- API communication
- WebRTC media interactions
- gesture events
- user experience logic
- theme switching
- routing

## Backend
The backend is built with Express and handles:
- authentication
- OTP generation and verification
- video and comment CRUD
- download quota logic
- payment handling
- invoice email sending
- comment translation proxy
- socket signaling for calls

## Database
MongoDB stores:
- users
- videos
- likes
- comments
- downloads
- watch history
- watch later entries
- premium plan data

---

# Folder Structure

```bash
YOU_TUBE_2.0-main/
│
├── yourtube/                     # Frontend (Next.js)
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   └── vercel.json
│
├── server/                       # Backend (Express)
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── Modals/
│   ├── uploads/
│   ├── scripts/
│   ├── package.json
│   └── .env.example
│
├── render.yaml
├── DEPLOYMENT.md
└── README.md
Frontend Features
Header
search
theme toggle
sign in
upgrade plan button
profile actions
start call shortcut
Sidebar
Home
Explore
Subscriptions
History
Liked Videos
Watch Later
Downloads
Channel
Watch Page
custom player
video metadata
premium watch lock
comment section
related videos
Downloads Page
lists downloaded videos for current user
acts as user’s download library
Premium Modal
Bronze / Silver / Gold plans
Razorpay test/live flow
invoice success messaging
Login Modal
email OTP or mobile OTP depending on region
OTP step
identifier-aware OTP status text
Backend Features
Auth Controller
Handles:

request OTP
verify OTP
Google login
profile updates
email OTP sending
SMS OTP sending fallback / integration support
Payment Controller
Handles:

create Razorpay order
verify payment signature
update user plan
prepare invoice details
send invoice email
Download Controller
Handles:

free plan daily download limit
premium unlimited downloads
download records
downloads listing
Comment Controller
Handles:

post comment
edit comment
delete comment
like comment
dislike comment
translation request
auto delete after 2 dislikes
special-character moderation
Socket.IO Signaling
Handles:

joining room
offer exchange
answer exchange
ICE candidates
disconnect events
Authentication Flow
OTP Request
User opens login modal
App detects region from geolocation
App decides auth mode:
email OTP if South India
mobile OTP otherwise
User enters identifier
OTP request is sent to backend
OTP Verify
User enters OTP
Backend verifies cache
User record is created or updated
Region and auth method are stored
User is logged in
Google Login
Google sign-in remains supported as an additional login path.

Theme Logic
Implemented in the frontend geolocation/time hook.

Conditions
time zone used: Asia/Kolkata
light theme only for South India users between 10:00 and 12:00 IST
dark theme in all other cases
Stored Data
detected region saved in local storage
theme preference can still be adjusted if needed
Plan System
Free
5-minute watch limit
1 download/day
Bronze
₹10
7-minute watch limit
unlimited downloads
Silver
₹50
10-minute watch limit
unlimited downloads
Gold
₹100
unlimited watch
unlimited downloads
Download System
The download system is designed to support both user convenience and monetization.

Free User Logic
first download of the day is allowed
second request is denied
user is prompted to upgrade
Premium Logic
all downloads are allowed
download record is saved
item appears in Downloads section
Video Calling System
The video call feature is based on:

WebRTC for media exchange
Socket.IO for signaling
Features
camera and mic control
screen sharing
live room link copy
local and remote video streams
local recording download
collaboration hint for sharing YouTube tab
Recording
The recorded file is saved locally using:

MediaRecorder
downloadable .webm output
Gesture Control System
The video player uses click/tap zones and multi-tap logic.

Supported actions
Gesture	Zone	Action
Single tap	Center	Play / Pause
Double tap	Left	Rewind 10s
Double tap	Right	Forward 10s
Triple tap	Center	Next video
Triple tap	Left	Open comments
Triple tap	Right	Exit player
This creates a highly interactive playback layer.

Comment System
Functionalities
create comment
city tag
likes
dislikes
translate button
moderation
Translation
The backend proxies translation using public translation request logic so users can:

write in any language
translate to selected target language
Moderation
Allowed content pattern accepts:

letters
numbers
spaces
basic punctuation
Rejected:

many special characters used in spammy comments
Auto Delete
If dislikes become >= 2:

comment is deleted automatically
Payment and Invoice Flow
Flow
User selects plan
Frontend requests order creation
Razorpay opens checkout
Backend verifies payment
User plan is updated
Invoice details are generated
Confirmation email is sent
Invoice includes
invoice ID
invoice date
plan name
amount
order ID
payment ID
watch limit details
Deployment
Frontend
Deployed on Vercel

Backend
Deployed on Render

Current Notes
The project includes deployment-ready configuration files:

yourtube/vercel.json
render.yaml
DEPLOYMENT.md
Environment Variables
Frontend .env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
Backend .env
PORT=5000
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/yourtube

FRONTEND_URL=https://your-frontend-url.vercel.app
FRONTEND_PREVIEW_URL=

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_SECRET=xxxxxxxxxx

OTP_FROM_EMAIL=no-reply@yourtube.app
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

SHOW_DEV_OTP=false

SMS_PROVIDER=textbelt
TEXTBELT_API_KEY=textbelt_test
SMS_API_URL=
SMS_API_KEY=
SMS_SENDER_ID=YourTube
How to Run Locally
1. Clone repository
git clone https://github.com/your-username/YOU_TUBE_2.0.git
cd YOU_TUBE_2.0-main
2. Start backend
cd server
npm install
npm run dev
3. Start frontend
cd ../yourtube
npm install
npm run dev
4. Open app
http://localhost:3000
Backend default:

http://localhost:5000
Screens / User Journey
User can
visit homepage
browse videos
watch a video
use gestures in player
like / dislike videos
save to watch later
leave comments
translate comments
download a video
hit free limit
open premium upgrade modal
pay using Razorpay
receive invoice email
access Downloads page
open video call room
share screen
record call
save recording locally
API Overview
Auth
POST /user/login
POST /user/request-otp
POST /user/verify-otp
Video
GET /video/getall
upload and video CRUD routes
Like
like / dislike video endpoints
History
add history
fetch history
update views
Watch Later
add/remove watch later
fetch saved items
Comments
GET /comment/:videoid
POST /comment/postcomment
POST /comment/translate
POST /comment/like/:id
POST /comment/dislike/:id
Payment
POST /payment/create-order
POST /payment/verify
Downloads
GET /download/getall
POST /download/request
Testing Notes
Verified areas
frontend builds successfully
backend syntax checks pass
Vercel deployment support added
Render deployment support added
payment flow supports mock mode
OTP logic switches based on region
dynamic theme logic applies based on IST + South India
premium modal works from multiple entry points
Known Limitations
1. OTP Delivery Requires Real Providers
For production login:

email OTP requires SMTP credentials
mobile OTP requires SMS provider credentials
2. Persistent Database Recommended
If using memory Mongo fallback for hosting:

data will not persist forever
MongoDB Atlas is recommended
3. Browser Restrictions
Screen sharing and recording depend on browser permissions.

4. window.close()
Some browsers block force-close behavior unless the window was script-opened.

5. Translation Service
Current translation flow depends on external translation request availability.

Future Improvements
persistent production MongoDB Atlas setup
full Twilio / MSG91 SMS integration
better channel system with subscriptions persistence
push notifications
comment replies / nested threads
playlist support
admin moderation panel
analytics dashboard
live streaming support
real-time chat during calls
resumable downloads
background upload processing
image thumbnail generation
stronger anti-spam moderation
CDN-backed media delivery
better invoice PDF generation
usage analytics per premium plan
Why This Project Stands Out
This project is more than a CRUD video app.

It combines:

media platform behavior
real-time communication
monetization
context-aware theming
location-based authentication
gesture-driven playback
comment translation and moderation
deployment-ready full-stack architecture
It demonstrates the ability to build:

feature-rich frontend interfaces
business-rule heavy backend logic
real-world payment integration
real-time RTC flows
personalized and dynamic user experiences
Author
Vamshi Chethan

If you liked this project, feel free to star the repository and explore the code.

Final Summary
YourTube 2.0 is a next-generation video-sharing and collaboration platform that blends:

streaming
premium access
downloads
smart authentication
dynamic theming
social interaction
real-time calling
and collaborative viewing
into one unified full-stack project.

It is built to demonstrate strong software engineering skills across:

frontend
backend
real-time systems
payments
auth flows
product thinking
and deployment readiness.

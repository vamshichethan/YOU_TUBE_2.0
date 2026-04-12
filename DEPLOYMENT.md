# Deployment

## Recommended setup

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## Backend on Render

1. Create a new Web Service from this repo.
2. Set `Root Directory` to `server`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add env vars from [server/.env.example](/Users/vamshi/Desktop/YOU_TUBE_2.0-main/server/.env.example).
6. After deploy, copy the backend URL.

## Frontend on Vercel

1. Import the same repo into Vercel.
2. Set the project root to `yourtube`.
3. Add env vars from [yourtube/.env.example](/Users/vamshi/Desktop/YOU_TUBE_2.0-main/yourtube/.env.example).
4. Set `NEXT_PUBLIC_BACKEND_URL` to your Render backend URL.
5. Redeploy after the backend is live.

## Important notes

- Add your Vercel frontend URL to `FRONTEND_URL` on the backend.
- Socket.io calls use the same backend URL, so `NEXT_PUBLIC_BACKEND_URL` must be correct.
- Payment and email features need real Razorpay and SMTP credentials in production.
- SMS OTP for non-South-India users can use `TEXTBELT_API_KEY` or your own SMS API endpoint.

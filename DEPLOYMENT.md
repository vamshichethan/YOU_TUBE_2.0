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
7. Set `FRONTEND_URL` to your main Vercel domain. If you use multiple aliases or preview domains, add them to `ALLOWED_ORIGINS` as a comma-separated list.
8. For OTP delivery, set `BREVO_API_KEY` for email and `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` for SMS.

## Frontend on Vercel

1. Import the same repo into Vercel.
2. Set the project root to `yourtube`.
3. Add env vars from [yourtube/.env.example](/Users/vamshi/Desktop/YOU_TUBE_2.0-main/yourtube/.env.example).
4. Set `NEXT_PUBLIC_BACKEND_URL` to your Render backend URL.
5. Redeploy after the backend is live.

## Important notes

- Add your Vercel frontend URL to `FRONTEND_URL` on the backend. `ALLOWED_ORIGINS` can hold extra Vercel aliases if needed.
- Socket.io calls use the same backend URL, so `NEXT_PUBLIC_BACKEND_URL` must be correct.
- Payment features need real Razorpay credentials in production.
- OTP email uses Brevo when `BREVO_API_KEY` is set, with SMTP as a fallback option.
- OTP SMS uses Twilio when `TWILIO_*` variables are set, with custom SMS APIs still supported as a fallback.

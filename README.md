# YourTube 2.0

A full-stack YouTube-inspired web application built with **Next.js**, **React**, **Node.js**, **Express**, **MongoDB**, **Socket.IO**, and **Razorpay**, designed to go beyond a basic video platform by combining:

- video streaming
- smart region-based authentication
- dynamic theme switching
- plan-based content access
- download restrictions with premium upgrades
- video calling with screen sharing
- local call recording
- multilingual comments with translation
- gesture-based video controls
- payment verification with invoice email support

This project is built as an enhanced social video platform where entertainment, communication, subscriptions, and personalized UX all come together in one app.

---

# Table of Contents

- [Project Overview](#project-overview)
- [Core Idea](#core-idea)
- [Main Features](#main-features)
- [Feature Breakdown](#feature-breakdown)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [How It Works](#how-it-works)
- [Authentication Flow](#authentication-flow)
- [Theme Logic](#theme-logic)
- [Video Download Logic](#video-download-logic)
- [Premium Plan Logic](#premium-plan-logic)
- [Comment System Logic](#comment-system-logic)
- [Video Call Logic](#video-call-logic)
- [Gesture Control Logic](#gesture-control-logic)
- [Payment and Invoice Flow](#payment-and-invoice-flow)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Run the Project](#run-the-project)
- [Production Notes](#production-notes)
- [Current Status](#current-status)
- [Possible Improvements](#possible-improvements)
- [Known Limitations](#known-limitations)
- [Screens / Modules Included](#screens--modules-included)
- [API Overview](#api-overview)
- [Why This Project Is Different](#why-this-project-is-different)
- [Author](#author)

---

# Project Overview

**YourTube 2.0** is not just a video streaming website clone.

It is a **feature-rich, context-aware, socially interactive media platform** that introduces:

- **location-aware login behavior**
- **time-aware theme switching**
- **free vs premium usage restrictions**
- **in-app video calling**
- **screen sharing for co-watching**
- **call recording to local device**
- **multilingual moderated comments**
- **gesture-driven player controls**
- **Razorpay-based plan upgrades**
- **download and watch-time monetization**

The platform is designed to feel like a smart, modern, app-like video experience while still being implemented as a web application.

---

# Core Idea

The goal of this project is to build a platform where users can:

- watch videos
- interact with content socially
- connect with friends using video calls
- share their screen during calls
- record collaborative sessions
- download content with plan-based restrictions
- upgrade plans for better benefits
- experience dynamic UI changes based on time and location
- log in using different OTP methods depending on region
- interact in a multilingual comment space with translation and moderation

---

# Main Features

## 1. Smart Theme Based on Time and Location

The website automatically changes theme based on:

- **time in IST**
- **detected user region**

### Light Theme Rule
The site becomes **light theme** only if:

- time is between **10:00 AM and 12:00 PM IST**
- user location is one of:
  - Tamil Nadu
  - Kerala
  - Karnataka
  - Andhra Pradesh
  - Telangana

### Dark Theme Rule
For all other time ranges or regions, the site uses **dark theme**.

---

## 2. Region-Based OTP Authentication

Authentication changes based on the user’s region.

### South India Users
If the detected state is one of:

- Tamil Nadu
- Kerala
- Karnataka
- Andhra Pradesh
- Telangana

Then login uses:

- **OTP sent to registered email address**

### Users Outside South India
Login uses:

- **OTP sent to registered mobile number**

This creates a region-sensitive authentication experience.

---

## 3. Premium Subscription Plans

Users can upgrade from the default free plan into premium plans.

### Available Plans

| Plan | Price | Video Watch Limit |
|------|------:|------------------|
| Free | ₹0 | 5 minutes |
| Bronze | ₹10 | 7 minutes |
| Silver | ₹50 | 10 minutes |
| Gold | ₹100 | Unlimited |

---

## 4. Download System with Plan Restriction

Users can download videos directly from the platform.

### Free Users
- can download **only 1 video per day**

### Premium Users
- can download **unlimited videos per day**

All downloaded content is visible in the **Downloads** section.

---

## 5. Razorpay Payment Integration

Users can upgrade plans through **Razorpay**.

### Payment Flow
- user chooses plan
- order is created
- payment is completed
- payment signature is verified
- user plan is updated
- invoice email is triggered

---

## 6. Invoice Email After Successful Upgrade

After a successful payment, the user receives an email containing:

- invoice ID
- invoice date
- selected plan
- amount paid
- watch time limit
- order ID
- payment ID

This improves trust, transparency, and professionalism.

---

## 7. Video Calling (VoIP-like Experience)

Users can start a live video call inside the app.

### Included:
- real-time media sharing
- room-based joining
- WebRTC peer connection
- Socket.IO signaling
- microphone toggle
- camera toggle
- call termination

---

## 8. Screen Sharing During Call

During a call, a user can share their screen.

This is especially useful for:

- co-watching a YouTube tab
- discussing content together
- presenting media in real time

The UI explicitly guides users to choose the browser tab for shared viewing.

---

## 9. Local Call Recording

Users can record the active video call.

### Recording Behavior
- recording starts inside the browser
- recorded media is combined from active local and remote streams
- when recording stops, the file downloads automatically
- recording is stored **locally on the user’s device**

---

## 10. Gesture-Based Video Player Controls

The custom video player supports rich gesture interactions.

### Gesture Mapping

#### Double Tap Left
- seek backward by 10 seconds

#### Double Tap Right
- seek forward by 10 seconds

#### Single Tap Center
- pause/resume video

#### Triple Tap Center
- skip to next video

#### Triple Tap Left
- open comments section

#### Triple Tap Right
- close website / exit player flow

This gives the platform a mobile-app-like experience.

---

## 11. Multilingual Comment System

Users can post comments in any language.

### Included Features
- comment posting
- likes
- dislikes
- translation
- city tagging
- moderation rules
- auto-removal logic

---

## 12. Comment Translation

Users can translate comments into supported languages.

### Supported examples
- English
- Hindi
- Telugu
- Tamil
- Kannada
- Spanish
- French

Translation helps create a more inclusive and accessible discussion space.

---

## 13. Location Tagging on Comments

Each comment displays the user’s city name for extra context.

Example:

`Nice video! — Bangalore`

---

## 14. Comment Moderation Rules

### Special Character Blocking
Comments containing disallowed special characters are rejected.

### Auto Delete on 2 Dislikes
If a comment gets **2 dislikes**, it is automatically removed from the platform.

This helps reduce spam and low-quality content.

---

## 15. Standard Platform Features

The app also includes normal YouTube-like platform features such as:

- home feed
- explore
- subscriptions page
- liked videos
- watch later
- history
- downloads
- channel page
- related videos
- search
- premium upgrade modal
- sign in modal
- responsive UI

---

# Feature Breakdown

# Dynamic Theme System

The app uses geolocation + IST time logic to decide theme.

### Input sources:
- IP/location API
- browser time conversion to IST

### Logic:
```text
IF state is in South India
AND time is between 10:00 and 12:00 IST
THEN theme = light
ELSE theme = dark

This is implemented in the frontend theme hook and applied to the root document.


Authentication Flow
The login flow is region-sensitive.

South India

User enters email
→ backend generates OTP
→ email OTP sent
→ user verifies OTP
→ account created or logged in

Other Regions

User enters mobile number
→ backend generates OTP
→ SMS OTP sent
→ user verifies OTP
→ account created or logged in

The backend stores OTP temporarily and validates it with expiry logic.


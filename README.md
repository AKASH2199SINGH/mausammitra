# MausamMitra 

Build a production-quality frontend prototype for MausamMitra — Voice & AI-Powered Resilient Smart Hazard Advisory Assistant, based on SIH Problem Statement 26068.

Create a serious, premium disaster-management command center, NOT a generic AI-generated dashboard.

Core UX

Build a responsive web app with:

Command Center dashboard

Hyperlocal GIS risk map

AI weather assistant/chat

Active alerts & warnings

Personalized advisory panel

Citizen / Farmer / Authority modes

Voice interaction UI

Weather + forecast overview

Flood / Heat / Storm risk intelligence

“Why this risk?” explainability

Source, timestamp, validity and confidence indicators

Notification/alert center

System/backend status indicator

Visual Design

Use Spatial UI + restrained Glassmorphism + subtle Neomorphism.
Dark professional meteorological/disaster-response aesthetic with excellent contrast and typography.
Use layered translucent surfaces, realistic depth, soft shadows, subtle borders, restrained blur and spatial composition.
Avoid excessive glass effects, gradients, glowing neon, cartoon illustrations, oversized pills, excessive rounded cards, generic AI blobs, stock-dashboard appearance, or template-like layouts.
The interface should feel like a real emergency/weather intelligence product, not a student project.

Use weather/GIS visual language: radar-inspired overlays, terrain/map layers, rainfall patterns, warning zones, risk contours and data-rich but uncluttered information hierarchy.

Main Dashboard

Show:

Current location

Current weather

Temperature, rainfall, wind, humidity

Active official warning

Overall hazard status

Flood Risk

Heat Risk

Storm Risk

Forecast timeline

Recent alerts

Personalized “What should I do?” advisory

Data freshness / last updated timestamp

Backend/data connection status

Risk Map

Create a large interactive-feeling GIS map area with toggleable layers:
Rainfall, Flood Risk, Heat Risk, Storm Risk, Warning Zones, Emergency Zones.
Use realistic India-focused sample locations and believable risk data.
Clicking a zone should open:
Risk level → Why → contributing factors → recommended action → source → validity.

AI Assistant

Create a polished conversational interface where users can ask:
“Will it rain today?”
“Can I travel at 6 PM?”
“Should I irrigate my field?”
“What should I do during this warning?”
Show grounded responses with:
weather facts, risk level, recommended actions, source, timestamp and confidence.
Clearly distinguish Official Warning from MausamMitra Advisory.

User Modes

Provide a prominent mode selector:
Citizen | Farmer | Authority

Change dashboard/advisory content based on the selected mode.

Authority Command Center

Include a professional operational view with:
active warnings, high-risk zones, critical zones, affected-area estimate, hazard trends and priority locations.

Voice

Add a prominent microphone interaction with Hindi/English language selection and realistic voice-processing states:
Listening → Processing → Response.
This can be frontend-only/mock for the prototype.

Architecture

Keep the code modular and future-proof.
Create reusable components, typed data models/interfaces, centralized mock API/service layer and clear separation between UI, data services and business logic.
Do NOT hardcode data directly throughout components.
All mock weather/risk/alert/chat data should come from centralized services so real FastAPI endpoints can replace them later without redesigning the UI.

Prepare API/service abstractions for future endpoints such as:
GET /weather/current
GET /weather/forecast
GET /alerts
GET /risk
GET /risk/zones
POST /chat
POST /voice/transcribe
GET /advisory
WS /live

Use realistic mock data for the prototype so every screen works immediately.

Technical

Use React + TypeScript + Tailwind.
Use a clean component architecture.
Use a map library or a convincing GIS-style interactive map placeholder if external map configuration is unavailable.
Ensure responsive desktop/tablet/mobile layouts.
Add subtle, purposeful transitions and micro-interactions.
No unnecessary dependencies.
No fake backend implementation.
No authentication/payment pages unless required.
Prioritize the command center, risk map, advisory, alerts and AI assistant.

The final result should look like a credible SIH national-level disaster-management technology prototype that can later connect directly to a Python/FastAPI + PostgreSQL/PostGIS + ML + LLM backend without rebuilding the frontend.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/580ff1c5-a59e-40c1-a1e0-4ae273d4eefb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

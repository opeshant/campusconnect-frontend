# CampusConnect Frontend

React + Vite frontend for the supplied Anonymous_Chatting_App backend.

## Requirements
- Node.js 20+ recommended
- Backend running locally on port 3000
- MongoDB connected and backend `.env` configured

## Run
```bash
npm install
cp .env.example .env
npm run dev
```
Open http://localhost:5173.

Set `VITE_API_URL` in `.env` if your backend runs somewhere other than `http://localhost:3000`.

## Backend routes used
- `POST /api/v1/auth/signup` — `{ name, email, password }`
- `POST /api/v1/auth/signin` — `{ email, password }`; expects `data.token`, `data.name`, `data.email`
- `GET /api/v1/users/me` — Bearer token
- `PATCH /api/v1/users/me` — `{ name?, interests? }`
- `GET /api/v1/chats/:chatId/messages` — Bearer token

## Socket.IO events used
Client emits: `find_partner`, `send_message`, `typing`, `stop_typing`, `skip_partner`, `end_chat`.

Client listens: `waiting_for_partner`, `match_found`, `receive_message`, `message_sent`, `message_error`, `partner_typing`, `partner_stop_typing`, `partner_disconnected`, `partner_skipped`, `chat_ended`, `chat_end_error`, `skip_error`, `match_error`, `rate_limit_error`.

## Important backend notes
- The supplied signup endpoint currently checks the `@nitjsr.ac.in` format, but does **not** send a verification email. The UI does not claim that email ownership has been verified.
- The supplied Socket.IO code has rate-limit checks placed outside some event callbacks. Those checks are not executed per event. Review/fix this on the backend before relying on socket rate limiting in production.
- Socket.IO CORS is currently `origin: '*'`. Restrict it to your deployed frontend origin before production.
- Use HTTPS/WSS and a production-ready shared rate-limit store when deploying.

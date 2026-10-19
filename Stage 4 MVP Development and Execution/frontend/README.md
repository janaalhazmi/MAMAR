# MAMAR Frontend

React frontend for MAMAR, built with Vite and React Router.

## Requirements

- Node.js 18 or newer

## Run Locally

1. Open the `frontend` folder in the terminal and install the libraries:

   ```powershell
   npm install
   ```

2. (Optional) Create a `.env` file if the backend is not running on the default address:

   ```text
   VITE_API_URL=http://127.0.0.1:8000
   ```

   If `.env` is missing, the app falls back to `http://127.0.0.1:8000` automatically (see `src/services/api.js`).

3. Start the dev server:

   ```powershell
   npm run dev
   ```

4. Open `http://localhost:5173`. A small status badge (bottom-right corner) shows whether the backend is reachable — this is the Sprint 1 integration check, calling `GET /health`.

## Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `VITE_API_URL` | Base URL of the FastAPI backend | `http://127.0.0.1:8000` (local) / `https://mamar-api.onrender.com` (Render) |

## Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with the GitHub account that has access to this repository.
2. **Add New... > Project**, then import the `mamar` repository.
3. Configure the project:

   | Setting | Value |
   | --- | --- |
   | Framework Preset | Vite |
   | Root Directory | `Stage 4 MVP Development and Execution/frontend` |
   | Build Command | `npm run build` (default) |
   | Output Directory | `dist` (default) |
   | Environment Variable | `VITE_API_URL` = `https://mamar-api.onrender.com` |

4. Deploy. Vercel gives a URL such as `https://mamar.vercel.app`.
5. Add that URL to `FRONTEND_ORIGINS` on Render (Backend service > Environment), separated by a comma from the existing values, so the deployed backend accepts requests from the deployed frontend. Redeploy the backend if Render does not restart automatically.
6. Every push to the connected branch redeploys automatically on Vercel, the same way Render auto-deploys the backend.

### Integration Notes

- The backend's CORS only allows the origins listed in `FRONTEND_ORIGINS`. Until the Vercel URL is added there, requests from the deployed frontend to the deployed backend will fail with a CORS error (visible in the browser console), even though the backend itself is running.
- The free Render backend sleeps after 15 minutes of inactivity. The first request after that can take about a minute, so the status badge may show "Checking backend..." for longer than usual right after a period of inactivity.

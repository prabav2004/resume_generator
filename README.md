# Resume Generator

## Production deployment

### Backend (Render)
1. Create a new Web Service on Render.
2. Connect this repository and select the backend directory as the root.
3. Use the included [backend/render.yaml](backend/render.yaml) configuration.
4. Set the required environment variables from [backend/.env.example](backend/.env.example).
5. Deploy.

### Frontend (Vercel)
1. Create a new Vercel project and connect this repository.
2. Set the root directory to frontend.
3. Add the environment variable from [frontend/.env.example](frontend/.env.example).
4. Deploy.

### Health check
- Backend health endpoint: /api/v1/health

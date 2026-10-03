# Parking Manager (MERN)

## Start

1. Install MongoDB and start its local service.
2. Copy `server/.env.example` to `server/.env` and adjust `MONGODB_URI` if needed.
3. Copy `client/.env.example` to `client/.env` only when the API is not at its default address.
4. Install packages with `npm install --prefix server` and `npm install --prefix client`.
5. Run the API with `npm run dev --prefix server` and the client with `npm run dev --prefix client`.

The client opens at `http://localhost:5173` and connects to `http://localhost:5000/api`.

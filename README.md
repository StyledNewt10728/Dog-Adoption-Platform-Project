The folder structure designed by our software architects ensures adherence to best practices:

- `controllers`: Contains the logic for handling incoming requests and returning responses to the client.
- `models`: Defines the data models and interacts directly with the database.
- `routes`: Manages the routes of your API, directing requests to the appropriate controller.
- `middlewares`: Houses custom middleware functions, including authentication and rate limiting.
- `.env`: Stores environment variables, such as database connection strings and the JWT secret.
- `app.js`: The main entry point of your application, where you configure the Express app and connect all the pieces.
- `db.js`: Manages the database connection.
- `package.json`: Keeps track of npm packages and scripts necessary for your project.

This structure provides a solid foundation for building a well-organized, scalable backend service. By separating concerns into dedicated directories and files, your project remains clean, navigable, and easier to debug and extend.

View the rubric for this assessment [here](https://storage.googleapis.com/hatchways.appspot.com/employers/springboard/student_rubrics/Dog%20Adoption%20Platform%20Rubric.pdf)

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in a real `MONGODB_URI` (MongoDB Atlas connection string), `DB_NAME`, and a `JWT_SECRET`.
3. `npm start` (or `npm run dev` for auto-reload).

## Testing

`npm test` runs the Mocha/Chai suite in `tests/`. Tests spin up an in-memory MongoDB instance (`mongodb-memory-server`), so they don't touch the real Atlas database and don't require `.env` to be configured.

## API

All endpoints accept and return JSON. Authenticated endpoints require an `Authorization: Bearer <token>` header.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | No | Register a user with `{ username, password }` |
| POST | `/api/auth/login` | No | Log in with `{ username, password }`, returns a 24h JWT |
| POST | `/api/dogs` | Yes | Register a dog with `{ name, description }` |
| POST | `/api/dogs/:id/adopt` | Yes | Adopt a dog with `{ thankYouMessage }` |
| DELETE | `/api/dogs/:id` | Yes | Remove a dog you registered (only if not yet adopted) |
| GET | `/api/dogs/registered` | Yes | List dogs you registered; supports `?status=available\|adopted&page=&limit=` |
| GET | `/api/dogs/adopted` | Yes | List dogs you adopted; supports `?page=&limit=` |

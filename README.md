# CETracker Frontend

Web React App Frontend for CETracker (Cycling Equipment Usage Tracker).
For more information about this project see the [project's homeage](https://cetracker.github.io/).

## Basic Building Instructions

The Frontend is a simple web app using the api provided by the [cetracker backend](https://github.com/cetracker/cetrack-backend).

It is a React web app, based on [Vite](https://vitejs.dev/) and using [Matine](https://mantine.dev/), [Matine React Table](https://www.mantine-react-table.com/) plus [Tanstack Query](https://tanstack.com/query) (formerly known as React Query).

It requires NodeJs installed on the developer machine and may be build using either yarn, npm or similar tools.

### Yarn

```bash
yarn # to install all needed
yarn dev # to run locally and accessable on localhost:3001 (see vite.config.js)
yarn build # to build a "production" version
```

### npm

```bash
npm install
npm run dev
npm run build
```

When run locally, it expects the backend to run on `localhost:8080`. This can be changed via `.env.development`.

## Running the app as a Container Image

A container image will be available at `https://ghcr.io/cetracker/cetrack-frontend:VERSION`. The recommended and easiest way is to run it via docker-compose. A `docker-compose` file as well as instructions are available in the [cetrack-compose repository](https://github.com/cetracker/cetrack-compose).

### Building a container image locally

If you want test your modification inside a container image you may want to build your own image locally.

#### Docker

```bash
docker build -t ghcr.io/cetracker/cetrack-frontend:0.1.0-SNAPSHOT .
```

#### Podman / Buildah

See [Podman homepage](https://podman.io) for more information.

```bash
buildah build -t ghcr.io/cetracker/cetrack-frontend:0.0.1-SNAPSHOT
```

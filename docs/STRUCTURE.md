# Project structure

```text
Biz-Z/
  client/
    index.html
    public/               # favicon and fixed-URL assets
    src/                  # React application
      assets/
        brand/            # logo and wordmark
        mascot/           # character poses
        illustrations/    # page artwork
      hooks/
      schemas/
      services/
  server/                 # Express backend
    routes/
    models/
    middleware/
    services/
  docs/                   # rubric, API, defense, screenshots
  dist/                   # generated frontend build
  package.json            # shared dependencies and commands
  vite.config.ts          # client root and API proxy
  .env                    # ignored local configuration
```

Run npm commands from the project root. The frontend is in client; the backend remains in server. This filesystem layout does not resolve the instructor’s one-versus-two GitHub repository requirement. No repository operations are part of this change. Existing historical documentation references to src refer to client/src now.

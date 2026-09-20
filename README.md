# Humor do Dia

A simple React app to track and share your daily mood, with special surprises for coworkers and your husband.

## Features

- Enter your name and mood (1-10) for the day.
- See a random emoji based on your mood.
- Special GIFs and messages for:
  - **Coworkers**: Enter a name from the coworkers list to see a unique GIF.
  - **Husband**: Enter your husband’s name or nickname for hearts and a special GIF.

## Special Data

The app uses `appData.js` to manage special names and their GIFs:

- **Coworkers**: Names in the `coworkers` array trigger a unique GIF from `coworkerGifs`.
- **Husband**: Names in the `husband` array trigger hearts and a GIF from `husbandGifs`.

You can customize these arrays and GIF URLs in `src/app/appData.js`.

## Getting Started

1. Clone the repo:
```git clone https://github.com/isabellybaldo/humor-do-dia.git```

2. Install dependencies:
```npm install```

3. Start the app:
```npm start```

## Customization

Edit `src/app/appData.js` to add or change coworkers, husband names, and their GIFs.

## Deploy (VPS, Traefik)
DNS: `humor.isoca.space` A → VPS IP. On the VPS:
`git clone` this repo under /home/isoca/projects, `cp .env.example .env` and fill
`DB_PASSWORD`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, then
`docker compose up -d --build`. Migrations + seed run automatically on start.

## License

MIT
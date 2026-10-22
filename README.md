# Personal Portfolio Website

Coursework portfolio built from the Lecture 9 starter files. It presents five assignment projects, searchable project cards, light/dark theme, a contact form, and a server-side chatbot proxy for Vercel.

Personal facts (name, college, email, repository URLs) live in `js/config.js`. Empty values are hidden so the live site does not show placeholder text or invented achievements.

**Live website URL:** not deployed yet. Add the Vercel URL here after you publish.

## Features

- Responsive layout with a mobile navigation menu
- Text-based hero (no profile photo or image placeholders)
- About, skills, projects, and contact sections driven by configuration
- Exactly five assignment project cards
- Live project search (title, description, technologies) plus technology filters
- Light/dark theme with `localStorage` and system-preference fallback
- Contact form validation (email is sent only if you add a real form endpoint)
- Floating chatbot UI that calls `/api/chat` (requires server credentials)

## Technologies used

- HTML5, CSS3, vanilla JavaScript
- Vercel serverless function (`api/chat.js`) for the chatbot proxy

## Folder structure

```
portfolio/
  index.html
  css/style.css
  js/config.js
  js/script.js
  api/chat.js
  vercel.json
  .env.example
  .gitignore
  README.md
```

## Local setup

1. Fill in `js/config.js` with your name, college, email, GitHub, LinkedIn, and the five project repository URLs.
2. Start a static server from this folder, for example:
   - `python -m http.server 5500`
   - then open `http://localhost:5500`
3. The theme toggle, search, filters, and form validation work without an API key.
4. The chatbot needs a serverless runtime. Use `npx vercel dev` after setting a local `.env` (see below). A plain static server will show the chatbot error state, which is expected.

## Configuring the chatbot API

The class materials in this workspace did not name a specific provider. Set the provider your instructor taught.

1. Copy `.env.example` to `.env`.
2. Put the **secret key only** in `CHAT_API_KEY`. Never paste it into `index.html`, `js/script.js`, or GitHub.
3. Set `CHAT_PROVIDER` to `openai` for OpenAI-compatible APIs (OpenAI, Groq, and similar chat-completions endpoints) or `gemini` for Google Gemini.
4. Set `CHAT_API_URL` and `CHAT_MODEL` to the endpoint and model from class.
5. In Vercel, add the same variable names under Project Settings → Environment Variables, then redeploy.

Until those values are present and tested, the chat widget shows a configuration/error message. That is intentional. Do not describe the chatbot as working until you have sent a real message successfully.

## GitHub upload

Do not commit `.env`.

```bash
git add index.html css js api vercel.json .gitignore .env.example README.md
git commit -m "Add complete personal portfolio website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

Replace `YOUR-USERNAME` and `YOUR-REPO` with your real GitHub values. This README does not invent a repository URL.

## Vercel deployment

1. Push this project to GitHub.
2. Open [vercel.com](https://vercel.com), sign in, and import the GitHub repository.
3. Framework preset can stay default / Other. The site is static files plus `api/chat.js`.
4. Add environment variables before or immediately after the first deploy:
   - `CHAT_API_KEY`
   - `CHAT_PROVIDER`
   - `CHAT_API_URL`
   - `CHAT_MODEL`
5. Deploy. The production chatbot URL is `/api/chat` on the same domain (not localhost).
6. After deploy succeeds, paste the production URL at the top of this README.

## Environment variables

| Name | Purpose |
| --- | --- |
| `CHAT_API_KEY` | Secret API key (server only) |
| `CHAT_PROVIDER` | `openai` or `gemini` |
| `CHAT_API_URL` | Provider chat endpoint |
| `CHAT_MODEL` | Model id from class |

Optional contact delivery: set `contactFormEndpoint` in `js/config.js` to a Formspree or Web3Forms URL. Until then, the form validates input and tells visitors to email you directly.

## Editing content

- Personal information: `js/config.js`
- Project GitHub / live demo links: `projects` array in `js/config.js`
- Layout and styling: `index.html`, `css/style.css`
- Search, theme, form, chatbot client: `js/script.js`
- Chatbot server proxy: `api/chat.js`

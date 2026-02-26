<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/30288fd5-89e8-4c3c-99d0-0de1874e5cec

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages

This repo is configured to auto-deploy from `main` using GitHub Actions:

1. Push your code to the `main` branch.
2. In GitHub: `Settings -> Pages -> Build and deployment`, set `Source` to `GitHub Actions`.
3. The workflow at `.github/workflows/deploy-pages.yml` will build and publish the site.

Published URL:
`https://ibrahimbu11.github.io/Portfolio/`

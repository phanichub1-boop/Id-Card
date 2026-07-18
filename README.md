# Phanic ID Card Generator

This project generates student ID cards using a frontend-only CSV verification flow.

## Run locally

Open `index.html` directly in a browser, or host the folder with any static file server.

## Verification flow

The front-end loads the published Google Sheets CSV and validates `studentId` + `studentEmail` against it.

- Returns verification success only in the browser.
- The CSV must remain published for this to work.

## Notes

This is a pure frontend implementation. There is no backend server required.

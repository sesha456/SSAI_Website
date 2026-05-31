# Society for Students AI Innovations Website

Modern Angular frontend for the Society for Students AI Innovations (SSAI), built as a responsive university AI organization portal.

## Stack

- Angular 20 standalone components
- TypeScript
- Angular Router with lazy-loaded pages
- Reactive Forms
- Angular Material
- SCSS with responsive design, dark/light themes, glass UI, and animations
- Mock data services for events, projects, leadership, gallery, FAQs, testimonials, and stats

## Run Locally

```bash
npm install
npm start
```

Open `http://localhost:4200`.

## Build

```bash
npm run build
```

## Structure

```text
src/app
  core
    guards
    services
  shared
    components
    models
  pages
    home
    about
    events
    projects
    leadership
    gallery
    join
    contact
```

The app is ready for future additions such as authentication, admin dashboards, Firebase, blog content, and event registration persistence.

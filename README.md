# Voroa

A calm, focused task manager for planning the day and keeping everyday work moving.

## Features

- Create, complete, and delete tasks
- Organize tasks into Work, Personal, and Ideas collections
- Set priorities and due dates
- Filter tasks by today, upcoming, all, or completed
- Search tasks by title
- Save task changes in browser local storage
- Responsive layout with Tailwind CSS

## Development

```sh
npm install
npm run dev
```

Create a production build with `npm run build` and run lint checks with `npm run lint`.

Tasks are stored in the browser under the `voroa-tasks-v1` local-storage key. Clearing browser storage removes saved tasks.

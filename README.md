# Portfolio Static Site Generator

A Node.js-based static site generator for creating a professional portfolio and blogging website for freelance developers.

## Project Structure

```
project-root/
├── content/
│   ├── posts/          # Blog posts in markdown format
│   └── pages/          # Static pages in markdown format
├── templates/          # HTML templates with variable substitution
├── src/
│   └── generator.js    # Main static site generator script
├── public/             # Generated static HTML files (output)
├── package.json        # Node.js project configuration
└── README.md           # This file
```

## Setup Instructions

### Prerequisites
- Node.js v18 or higher
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

## Available Commands

- `npm run build` - Generate the static site from content and templates
- `npm run serve` - Build and serve the site locally at http://localhost:8080
- `npm run dev` - Watch mode for development (auto-rebuild on file changes)
- `npm run clean` - Remove all generated files in the `/public` folder

## Content Structure

### Blog Posts
- **Location:** `/content/posts/`
- **Naming:** `YYYY-MM-DD-slug.md` (e.g., `2025-11-10-my-first-post.md`)
- **Format:** Markdown with YAML front matter

Example:
```markdown
---
title: "My First Blog Post"
date: 2025-11-10
tags: ["web-dev", "nodejs"]
categories: ["Development"]
description: "Getting started with static sites"
---

# My First Blog Post

Content here...
```

### Static Pages
- **Location:** `/content/pages/`
- **Naming:** `page-name.md` (e.g., `about.md`, `services.md`)
- **Format:** Markdown with optional YAML front matter

Example:
```markdown
---
title: "About Me"
slug: "about"
---

# About Me

Content here...
```

## Templates

Templates are stored in the `/templates/` folder and use simple variable substitution:

- `{{ include:filename }}` - Include another template file
- `{{ main_content }}` - Insert main content
- `{{ title }}` - Page/post title
- `{{ date }}` - Publication date
- `{{ tags }}` - Tags list
- `{{ categories }}` - Categories list

## Development Workflow

1. Add content files to `/content/posts/` or `/content/pages/`
2. Update templates in `/templates/` as needed
3. Run `npm run build` to generate the static site
4. Run `npm run serve` to preview locally
5. Deploy the `/public` folder to your hosting platform

## Dependencies

- **gray-matter** - Parse YAML front matter from markdown
- **marked** - Convert markdown to HTML
- **highlight.js** - Syntax highlighting for code blocks
- **tailwindcss** - CSS utility framework
- **http-server** - Simple local development server
- **nodemon** - Auto-reload during development

## Next Steps

1. Create sample content in `/content/posts/` and `/content/pages/`
2. Design templates in `/templates/`
3. Build and preview the generator
4. Configure Tailwind CSS
5. Deploy to production

---

**Project Status:** Phase 1 - Foundation & Quick Preview

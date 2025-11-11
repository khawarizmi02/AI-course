# Product Requirements Document (PRD)
## Portfolio & Blogging Website - Static Site Generator

**Date:** November 11, 2025  
**Project Type:** Static Site Generator for Personal Portfolio  
**Target Audience:** Freelance Developer Personal Brand  
**Status:** MVP - Core Features

---

## 1. Project Overview

This project is a **static site generator (SSG)** that will create a professional portfolio and blogging website for a freelance developer. The site will showcase work, share technical insights through blog posts, and establish a personal brand online.

### Key Characteristics
- **Static Output:** Generated HTML files for fast performance and easy deployment
- **Content-Driven:** Markdown-based content with templating system
- **Developer-Friendly:** CLI-based build process with Node.js
- **Modern UI:** Tailwind CSS + shadcn component library
- **Dynamic Navigation:** Auto-generated menu from content structure

---

## 2. Goals & Objectives

### Primary Goals
1. Create a reusable static site generator for portfolio/blog content
2. Provide an easy way to create and publish blog posts and portfolio pages
3. Maintain clean separation between content, templates, and generator logic
4. Generate a production-ready website with a single CLI command

### Success Metrics (MVP)
- Website generates successfully from content without manual HTML editing
- Navigation automatically reflects all pages and posts
- All blog posts display correctly with metadata (date, tags, categories)
- Clean, professional UI using Tailwind CSS and shadcn components

---

## 3. Scope

### In Scope (MVP)
- Static site generation from markdown content
- Blog posts with metadata (date, tags, categories)
- Static pages (About, Services, Contact, etc.)
- Template-based rendering system
- CLI build command (`npm run build` or similar)
- Tailwind CSS styling for entire site
- shadcn components integration
- Responsive design for mobile/tablet/desktop
- Dynamically generated navigation menu

### Out of Scope (MVP)
- Search functionality
- SEO optimization (meta tags, sitemap, robots.txt)
- Comments system
- Server-side features or dynamic content
- Analytics integration
- Image optimization pipeline
- Dark mode toggle
- Internationalization (i18n)

---

## 4. Project Structure

```
project-root/
├── content/
│   ├── posts/
│   │   ├── 2025-11-10-my-first-blog-post.md
│   │   ├── 2025-11-09-web-development-tips.md
│   │   └── ...
│   └── pages/
│       ├── about.md
│       ├── services.md
│       ├── contact.md
│       └── ...
├── templates/
│   ├── main.html
│   ├── navigation.html
│   └── footer.html
├── src/
│   └── generator.js
├── public/
│   ├── index.html
│   ├── about/index.html
│   ├── posts/...
│   └── assets/
│       ├── css/
│       ├── js/
│       └── images/
├── package.json
├── tailwind.config.js
└── README.md
```

---

## 5. Core Features

### 5.1 Content Management

#### Blog Posts
- **Location:** `/content/posts/`
- **Format:** Markdown files with YAML front matter
- **Naming Convention:** `YYYY-MM-DD-slug.md`
- **Metadata:** Each post contains:
  - `title` (string)
  - `date` (YYYY-MM-DD format)
  - `tags` (array of strings)
  - `categories` (array of strings)
  - `description` (optional short excerpt)
  - `published` (boolean, default: true)

**Example:**
```markdown
---
title: "My First Blog Post"
date: 2025-11-10
tags: ["web-dev", "nodejs", "tutorial"]
categories: ["Development"]
description: "Getting started with Node.js development"
published: true
---

# My First Blog Post

Content goes here...
```

#### Static Pages
- **Location:** `/content/pages/`
- **Format:** Markdown files with optional YAML front matter
- **Metadata:**
  - `title` (string)
  - `slug` (URL path, auto-generated from filename if not specified)
  - `published` (boolean, default: true)

**Example:**
```markdown
---
title: "About Me"
slug: "about"
---

# About Me

Content goes here...
```

### 5.2 Template System

#### Template Engine
- Uses simple **template variable substitution**
- Supported tags:
  - `{{ include:<filename> }}` - Include another template file
  - `{{ main_content }}` - Insert main content (post/page body)
  - `{{ title }}` - Page/post title
  - `{{ date }}` - Publication date
  - `{{ tags }}` - Comma-separated tags
  - `{{ categories }}` - Comma-separated categories
  - `{{ navigation }}` - Generated navigation menu
  - `{{ footer }}` - Footer content

#### Template Files

**main.html** - Main layout wrapper
```html
<!DOCTYPE html>
<html>
<head>
    <title>{{ title }} - My Portfolio</title>
    {{ include:head }}
</head>
<body>
    {{ include:navigation }}
    <main class="main-content">
        {{ main_content }}
    </main>
    {{ include:footer }}
</body>
</html>
```

**navigation.html** - Navigation menu (auto-generated structure)
```html
<nav class="navbar">
    <ul>
        <!-- Auto-generated menu items from pages -->
    </ul>
</nav>
```

**footer.html** - Footer section
```html
<footer class="footer">
    <!-- Footer content -->
</footer>
```

### 5.3 Static Site Generator

#### CLI Command
```bash
npm run build
```

#### Generator Logic (`/src/generator.js`)
The generator performs the following steps:

1. **Read Configuration**
   - Parse `package.json` and config files

2. **Load Templates**
   - Read all template files from `/templates/`
   - Validate template syntax

3. **Process Content**
   - Scan `/content/posts/` and `/content/pages/`
   - Parse markdown and YAML front matter
   - Extract metadata

4. **Generate Navigation**
   - Build menu structure from pages
   - Create post archives/categories

5. **Render Pages**
   - For each post/page:
     - Parse markdown to HTML
     - Apply template with variables
     - Resolve includes
   - Save to `/public/` with appropriate directory structure

6. **Copy Assets**
   - Copy static files (CSS, JS, images) to `/public/assets/`

7. **Generate Index**
   - Create homepage listing recent posts
   - Create category/tag pages

#### Directory Output Structure
```
public/
├── index.html
├── about/
│   └── index.html
├── services/
│   └── index.html
├── posts/
│   ├── index.html (posts archive)
│   ├── 2025-11-10-my-first-blog-post/
│   │   └── index.html
│   ├── 2025-11-09-web-development-tips/
│   │   └── index.html
│   └── ...
├── categories/
│   ├── development/
│   │   └── index.html
│   └── ...
├── tags/
│   ├── nodejs/
│   │   └── index.html
│   └── ...
└── assets/
    ├── css/
    │   ├── tailwind.css (compiled)
    │   └── styles.css
    ├── js/
    └── images/
```

### 5.4 Styling & UI

#### Framework
- **Tailwind CSS** for utility-first styling
- **shadcn components** for pre-built component library
- No JavaScript framework (vanilla HTML/CSS only)

#### Components to Use
- Navigation bar (shadcn/ui)
- Cards for blog posts (shadcn/ui)
- Buttons (shadcn/ui)
- Badge for tags/categories (shadcn/ui)
- Code blocks with syntax highlighting
- Typography styles

#### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Tested on common devices/screen sizes

---

## 6. Technical Requirements

### 6.1 Technology Stack
- **Runtime:** Node.js (v18 or higher)
- **Build Tool:** npm scripts
- **Content Format:** Markdown (with YAML front matter)
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Dependencies:**
  - `gray-matter` - Parse YAML front matter
  - `marked` - Convert markdown to HTML
  - `highlight.js` - Code syntax highlighting
  - `tailwindcss` - CSS framework

### 6.2 Build Process
```bash
npm run build       # Generate static site
npm run dev         # Watch mode (optional, for development)
npm run serve       # Local preview (optional)
```

### 6.3 Deployment
- Generated `/public` folder ready for static hosting
- Can be deployed to: GitHub Pages, Vercel, Netlify, traditional web servers
- Simple `git push` workflow if using GitHub Pages

---

## 7. User Workflows

### Workflow 1: Creating a Blog Post
1. Create markdown file in `/content/posts/` with naming convention `YYYY-MM-DD-slug.md`
2. Add YAML front matter with title, date, tags, categories
3. Write markdown content
4. Run `npm run build`
5. Post appears on website with proper metadata

### Workflow 2: Creating a Static Page
1. Create markdown file in `/content/pages/` (e.g., `about.md`)
2. Add YAML front matter with title and slug
3. Write markdown content
4. Run `npm run build`
5. Page appears in navigation menu and on website

### Workflow 3: Updating Styling
1. Edit Tailwind CSS configuration or create custom CSS in `/templates/`
2. Update component markup in templates if needed
3. Run `npm run build`
4. Changes reflect on generated site

### Workflow 4: Deploying
1. Ensure all content and templates are ready
2. Run `npm run build` to generate production files
3. Deploy `/public` folder to hosting platform
4. Website is live

---

## 8. Content Guidelines

### Blog Posts
- **Naming:** `YYYY-MM-DD-slug.md` (e.g., `2025-11-10-getting-started-nodejs.md`)
- **Slug:** Should match filename without date and extension
- **Date:** Must be in YYYY-MM-DD format
- **Title:** Clear, descriptive, and SEO-friendly
- **Tags:** 2-5 relevant tags per post
- **Categories:** 1-2 primary categories
- **Content:** Use markdown with proper heading hierarchy (H1 for title, H2+ for sections)

### Static Pages
- **Naming:** Descriptive lowercase with hyphens (e.g., `about-me.md`, `contact.md`)
- **Slug:** Auto-generated from filename unless overridden
- **Title:** Clear page title
- **Content:** Standard markdown formatting

---

## 9. Navigation Structure

### Auto-Generated Navigation
The generator will automatically create a navigation menu based on:

**Primary Menu:**
- Home (index page)
- All pages from `/content/pages/` (sorted alphabetically)
- Blog (link to posts archive)

**Blog Section (Optional Sub-menu):**
- Recent Posts (latest 5)
- All Posts (posts archive page)
- Categories (category listing page)
- Tags (tag listing page)

### Navigation Data Example
```javascript
{
  "home": { "title": "Home", "url": "/" },
  "pages": [
    { "title": "About", "url": "/about/" },
    { "title": "Services", "url": "/services/" },
    { "title": "Contact", "url": "/contact/" }
  ],
  "blog": {
    "title": "Blog",
    "url": "/posts/",
    "submenu": [
      { "title": "All Posts", "url": "/posts/" },
      { "title": "Categories", "url": "/categories/" },
      { "title": "Tags", "url": "/tags/" }
    ]
  }
}
```

---

## 10. Implementation Phases

 Read more in [TODO](./TODO.md)

---

## 11. Definition of Done (MVP)

A feature/component is considered "done" when:
- ✅ Code is written and tested
- ✅ Documentation is updated
- ✅ Follows project structure and naming conventions
- ✅ No console errors or warnings
- ✅ Works as specified in requirements
- ✅ Responsive on desktop, tablet, and mobile

---

## 12. Assumptions & Constraints

### Assumptions
- Content creators are comfortable with Markdown and YAML
- Deployment is handled separately (not part of generator)
- No user authentication or admin panel needed
- Website content is publicly readable

### Constraints
- MVP focuses on core features only
- No backend server or database
- Static output only (no dynamic features)
- Limited to features that can be achieved with static HTML/CSS
- No external APIs or third-party integrations

---

## 13. Future Enhancements (Post-MVP)

- Search functionality
- SEO optimization (meta tags, sitemap, robots.txt)
- RSS feed generation
- Comments system (using third-party service like Disqus)
- Analytics integration
- Image optimization and lazy loading
- Dark mode toggle
- Reading time estimates for posts
- Related posts suggestions
- Social media sharing buttons
- Newsletter subscription
- Portfolio project showcase with filtering

---

## 14. Success Criteria

### MVP Success Metrics
- [ ] All blog posts render with correct metadata
- [ ] All static pages display properly
- [ ] Navigation menu auto-generates without errors
- [ ] Website is fully styled with Tailwind CSS
- [ ] shadcn components are properly integrated
- [ ] Build completes successfully with single CLI command
- [ ] Generated site is responsive on all screen sizes
- [ ] Deploy-ready output in `/public` folder

---

## 15. Glossary

| Term | Definition |
|------|-----------|
| **SSG** | Static Site Generator - tool that generates static HTML files |
| **Front Matter** | Metadata section at the top of markdown files (YAML format) |
| **Slug** | URL-friendly version of a title (lowercase, hyphens) |
| **Template Variable** | Placeholder like `{{ title }}` replaced with actual content |
| **Template Include** | `{{ include:filename }}` to insert another template file |
| **Asset** | Static files like CSS, JavaScript, images |
| **Build** | Process of generating static HTML from content and templates |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-11 | AI Assistant | Initial PRD creation |


# Implementation TODO List

## Phase 1: Foundation & Quick Preview (MVP Core)

### 1.1 Project Setup
- [x] Set up Node.js project with package.json
- [x] Install core dependencies (gray-matter, marked, highlight.js, tailwindcss)
- [x] Create project folder structure (content/, templates/, src/, public/)

### 1.2 Create Sample Content
- [x] Create sample blog posts in `/content/posts/` (2-3 posts with metadata)
  - [x] Post 1: Getting Started with Static Sites
  - [x] Post 2: Web Development Tips
  - [x] Post 3: My First Project
- [x] Create sample pages in `/content/pages/` (3-4 pages)
  - [x] about.md
  - [x] services.md
  - [x] contact.md
  - [x] portfolio.md

### 1.3 Create Sample Templates
- [x] Create `templates/main.html` (basic layout with Tailwind classes)
- [x] Create `templates/navigation.html` (simple navbar)
- [x] Create `templates/footer.html` (basic footer)
- [x] Create `templates/head.html` (meta tags, Tailwind CDN)

### 1.4 Build Template Engine & Generator
- [x] Create markdown parser with front matter support (gray-matter)
- [x] Build basic template engine with variable substitution
  - [x] {{ main_content }}
  - [x] {{ title }}
  - [x] {{ date }}
  - [x] {{ include:<filename> }}
- [x] Create CLI build command (`npm run build`)
- [x] Generate basic HTML pages from sample content

### 1.5 Generate HTML & CSS
- [x] Set up Tailwind CSS (use CDN for quick start, no build step yet)
- [x] Generate HTML files to `/public/` folder
- [x] Create basic CSS styling for blog posts and pages

### 1.6 Quick Preview
- [x] Create `npm run serve` command (simple local server using http-server)
- [x] Test generated website in browser
- [x] Verify all sample content renders correctly

## Phase 2: Content Processing & Advanced Features

### 2.1 Blog Post Features
- [ ] Implement proper date parsing and sorting
- [ ] Create posts archive page (`/posts/index.html`)
- [ ] Add tag/category indexing
- [ ] Generate tag listing page (`/tags/index.html`)
- [ ] Generate category listing page (`/categories/index.html`)
- [ ] Generate individual tag/category pages

### 2.2 Navigation Generation
- [ ] Auto-generate navigation menu from pages
- [ ] Create navigation data structure
- [ ] Update navigation template to use generated data
- [ ] Add active link detection

### 2.3 Homepage
- [ ] Create homepage template with featured/recent posts
- [ ] Add post card component

## Phase 3: Enhanced Styling & UI

### 3.1 Tailwind CSS Integration
- [ ] Move from CDN to local Tailwind (PostCSS build)
- [ ] Create tailwind.config.js with custom configuration
- [ ] Add custom CSS for code blocks and typography

### 3.2 shadcn/ui Components
- [ ] Integrate shadcn/ui components
- [ ] Use components for:
  - [ ] Navigation bar
  - [ ] Cards (blog posts)
  - [ ] Buttons
  - [ ] Badges (tags/categories)
- [ ] Update templates with component markup

### 3.3 Responsive Design
- [ ] Test and fix responsive layout on mobile/tablet/desktop
- [ ] Optimize breakpoints
- [ ] Ensure navigation is mobile-friendly

## Phase 4: Advanced Features & Polish

### 4.1 Asset Management
- [ ] Add asset copying functionality (images, fonts)
- [ ] Organize assets in `/public/assets/`
- [ ] Handle image paths in markdown

### 4.2 Code Highlighting
- [ ] Integrate syntax highlighting (highlight.js)
- [ ] Add language support for common languages
- [ ] Style code blocks with Tailwind

### 4.3 Testing & Quality
- [ ] Test all pages render correctly
- [ ] Verify metadata display (dates, tags, categories)
- [ ] Test navigation functionality
- [ ] Check all links work

### 4.4 Documentation & Deployment
- [ ] Create README.md with setup instructions
- [ ] Document build and deployment process
- [ ] Create example `.env` file (if needed)
- [ ] Prepare deployment documentation

### 4.5 Performance & Polish
- [ ] Minify generated HTML/CSS
- [ ] Add source maps for debugging
- [ ] Create watch mode for development (`npm run dev`)
- [ ] Add error handling and validation

---

## Legend

- ✅ Completed
- ⏳ In Progress
- ⬜ Not Started

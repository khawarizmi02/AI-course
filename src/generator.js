#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const hljs = require('highlight.js');

// Configure marked with highlight.js
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error(`Error highlighting ${lang}:`, err);
      }
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
});

// ============================================
// CONFIGURATION
// ============================================

const config = {
  contentDir: './content',
  postsDir: './content/posts',
  pagesDir: './content/pages',
  templatesDir: './templates',
  publicDir: './public',
  siteTitle: 'My Portfolio',
  siteUrl: 'https://example.com',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Read file content
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err.message);
    return null;
  }
}

/**
 * Write file content
 */
function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Get all files in directory
 */
function getFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  return fs.readdirSync(dirPath).filter(file => file.endsWith('.md'));
}

/**
 * Extract slug from filename
 */
function getSlug(filename) {
  // Remove .md extension
  let slug = filename.replace(/\.md$/, '');
  
  // If it's a post (starts with date), remove the date prefix
  if (/^\d{4}-\d{2}-\d{2}-/.test(slug)) {
    slug = slug.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  }
  
  return slug;
}

/**
 * Create directory structure for URL
 */
function createUrlPath(slug) {
  return `/${slug}/`;
}

// ============================================
// MARKDOWN & FRONT MATTER PARSING
// ============================================

/**
 * Parse markdown file with front matter
 */
function parseMarkdownFile(filePath) {
  const content = readFile(filePath);
  if (!content) return null;

  const { data, content: markdown } = matter(content);
  const html = marked.parse(markdown);

  return {
    frontMatter: data,
    markdown: markdown,
    html: html,
  };
}

/**
 * Load all posts
 */
function loadPosts() {
  const postFiles = getFiles(config.postsDir);
  
  const posts = postFiles
    .map(file => {
      const filePath = path.join(config.postsDir, file);
      const parsed = parseMarkdownFile(filePath);
      
      if (!parsed) return null;
      
      const { frontMatter, html } = parsed;
      const slug = getSlug(file);
      
      // Skip unpublished posts
      if (frontMatter.published === false) return null;
      
      return {
        filename: file,
        slug: slug,
        url: createUrlPath(`posts/${slug}`),
        title: frontMatter.title || 'Untitled',
        date: frontMatter.date,
        tags: frontMatter.tags || [],
        categories: frontMatter.categories || [],
        description: frontMatter.description || '',
        html: html,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
  
  return posts;
}

/**
 * Load all pages
 */
function loadPages() {
  const pageFiles = getFiles(config.pagesDir);
  
  const pages = pageFiles
    .map(file => {
      const filePath = path.join(config.pagesDir, file);
      const parsed = parseMarkdownFile(filePath);
      
      if (!parsed) return null;
      
      const { frontMatter, html } = parsed;
      const defaultSlug = getSlug(file);
      const slug = frontMatter.slug || defaultSlug;
      
      // Skip unpublished pages
      if (frontMatter.published === false) return null;
      
      return {
        filename: file,
        slug: slug,
        url: createUrlPath(slug),
        title: frontMatter.title || 'Untitled',
        html: html,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title)); // Sort by title
  
  return pages;
}

// ============================================
// TEMPLATE ENGINE
// ============================================

/**
 * Load template file
 */
function loadTemplate(templateName) {
  const templatePath = path.join(config.templatesDir, `${templateName}.html`);
  return readFile(templatePath);
}

/**
 * Process template includes recursively
 */
function processIncludes(template, depth = 0) {
  if (depth > 10) {
    console.error('Template include depth exceeded (possible circular reference)');
    return template;
  }

  const includeRegex = /\{\{\s*include:\s*(\w+)\s*\}\}/g;
  
  return template.replace(includeRegex, (match, templateName) => {
    const includedTemplate = loadTemplate(templateName);
    
    if (!includedTemplate) {
      console.warn(`Warning: Template not found: ${templateName}`);
      return '';
    }

    return processIncludes(includedTemplate, depth + 1);
  });
}

/**
 * Substitute template variables
 */
function substituteVariables(template, data) {
  let result = template;

  // Replace simple variables: {{ variable }}
  const variableRegex = /\{\{\s*(\w+)\s*\}\}/g;
  
  result = result.replace(variableRegex, (match, variable) => {
    if (variable in data) {
      const value = data[variable];
      
      // Handle arrays (tags, categories)
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      
      return value || '';
    }
    
    // If variable not found, return empty string
    return '';
  });

  return result;
}

/**
 * Render template with data
 */
function renderTemplate(templateName, data) {
  let template = loadTemplate(templateName);
  
  if (!template) {
    console.error(`Error: Template not found: ${templateName}`);
    return null;
  }

  // Process includes first
  template = processIncludes(template);

  // Substitute variables
  template = substituteVariables(template, data);

  return template;
}

// ============================================
// PAGE GENERATION
// ============================================

/**
 * Generate individual page
 */
function generatePage(pageData, templateName = 'main') {
  const html = renderTemplate(templateName, {
    title: pageData.title,
    main_content: pageData.html,
    date: pageData.date || '',
    tags: pageData.tags || [],
    categories: pageData.categories || [],
  });

  return html;
}

/**
 * Save page to public directory
 */
function savePage(pageData, html) {
  const filePath = path.join(config.publicDir, pageData.url, 'index.html');
  writeFile(filePath, html);
  console.log(`✓ Generated: ${pageData.url}`);
}

// ============================================
// HOMEPAGE GENERATION
// ============================================

/**
 * Generate homepage with recent posts
 */
function generateHomepage(posts, pages) {
  const recentPosts = posts.slice(0, 5);
  
  const postsHtml = recentPosts
    .map(post => `
      <article class="mb-6 pb-6 border-b border-gray-200">
        <h2 class="text-2xl font-bold mb-2">
          <a href="${post.url}" class="text-blue-600 hover:text-blue-800">${post.title}</a>
        </h2>
        <div class="text-sm text-gray-500 mb-2">
          ${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <p class="text-gray-600 mb-3">${post.description}</p>
        <a href="${post.url}" class="text-blue-600 hover:text-blue-800 font-medium">Read more →</a>
      </article>
    `)
    .join('');

  const homeContent = `
    <div class="max-w-3xl mx-auto px-4 py-12">
      <section class="mb-12">
        <h1 class="text-4xl font-bold mb-4">Welcome to My Portfolio</h1>
        <p class="text-lg text-gray-600 mb-6">
          Freelance developer passionate about building elegant solutions. Explore my work and latest articles below.
        </p>
        <a href="/contact/" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
          Get in Touch
        </a>
      </section>

      <section>
        <h2 class="text-3xl font-bold mb-6">Recent Blog Posts</h2>
        ${postsHtml}
        <div class="text-center mt-8">
          <a href="/posts/" class="inline-block text-blue-600 hover:text-blue-800 font-medium">
            View all posts →
          </a>
        </div>
      </section>
    </div>
  `;

  const html = renderTemplate('main', {
    title: config.siteTitle,
    main_content: homeContent,
  });

  return html;
}

// ============================================
// POSTS ARCHIVE
// ============================================

/**
 * Generate posts archive page
 */
function generatePostsArchive(posts) {
  const postsHtml = posts
    .map(post => `
      <article class="mb-6 pb-6 border-b border-gray-200">
        <h2 class="text-2xl font-bold mb-2">
          <a href="${post.url}" class="text-blue-600 hover:text-blue-800">${post.title}</a>
        </h2>
        <div class="text-sm text-gray-500 mb-2">
          ${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          ${post.tags.length > 0 ? `<span class="ml-4">Tags: ${post.tags.join(', ')}</span>` : ''}
        </div>
        <p class="text-gray-600">${post.description}</p>
      </article>
    `)
    .join('');

  const archiveContent = `
    <div class="max-w-3xl mx-auto px-4 py-12">
      <h1 class="text-4xl font-bold mb-8">Blog Posts</h1>
      ${postsHtml}
    </div>
  `;

  const html = renderTemplate('main', {
    title: 'Blog - ' + config.siteTitle,
    main_content: archiveContent,
  });

  return html;
}

// ============================================
// MAIN BUILD FUNCTION
// ============================================

/**
 * Main build function
 */
function build() {
  console.log('🚀 Starting build...\n');

  // Ensure output directory exists
  ensureDir(config.publicDir);

  // Load content
  console.log('📖 Loading content...');
  const posts = loadPosts();
  const pages = loadPages();
  
  console.log(`   Found ${posts.length} posts and ${pages.length} pages\n`);

  // Generate pages
  console.log('📝 Generating pages...');
  pages.forEach(page => {
    const html = generatePage(page);
    savePage(page, html);
  });
  console.log();

  // Generate posts
  console.log('📰 Generating blog posts...');
  posts.forEach(post => {
    const html = generatePage(post);
    savePage(post, html);
  });
  console.log();

  // Generate homepage
  console.log('🏠 Generating homepage...');
  const homepageHtml = generateHomepage(posts, pages);
  writeFile(path.join(config.publicDir, 'index.html'), homepageHtml);
  console.log('✓ Generated: /\n');

  // Generate posts archive
  console.log('📚 Generating posts archive...');
  const archiveHtml = generatePostsArchive(posts);
  writeFile(path.join(config.publicDir, 'posts', 'index.html'), archiveHtml);
  console.log('✓ Generated: /posts/\n');

  console.log('✅ Build complete!\n');
  console.log(`📂 Output directory: ${path.resolve(config.publicDir)}\n`);
}

// ============================================
// CLI EXECUTION
// ============================================

if (require.main === module) {
  try {
    build();
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { build, loadPosts, loadPages, renderTemplate };

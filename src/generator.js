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
 * Render template with data and navigation
 */
function renderTemplate(templateName, data, navigation = null) {
	let template = loadTemplate(templateName);

	if (!template) {
		console.error(`Error: Template not found: ${templateName}`);
		return null;
	}

	// Add navigation HTML to data if provided
	if (navigation) {
		data.navigation = generateNavigationHtml(navigation);
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
function generatePage(pageData, templateName = 'main', navigation = null) {
	const html = renderTemplate(
		templateName,
		{
			title: pageData.title,
			main_content: pageData.html,
			date: pageData.date || '',
			tags: pageData.tags || [],
			categories: pageData.categories || [],
		},
		navigation
	);

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
 * Generate post card HTML
 */
function generatePostCard(post) {
	const categoryBadges = post.categories
		.map(
			cat => `
      <span class="inline-block badge badge-primary text-xs font-semibold mr-2 mb-2">
        ${cat}
      </span>
    `
		)
		.join('');

	const tagLinks = post.tags
		.slice(0, 3) // Show max 3 tags
		.map(
			tag => `
      <a href="/tags/${slugifyTag(tag)}/" class="inline-block text-blue-600 hover:text-blue-700 text-xs sm:text-sm mr-2 transition-colors duration-200 hover:underline">
        #${tag}
      </a>
    `
		)
		.join('');

	return `
    <div class="card group transform transition-all duration-300 hover:-translate-y-2 h-full flex flex-col touch-safe-sm sm:touch-safe">
      <!-- Accent Bar (Top) -->
      <div class="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 group-hover:h-2"></div>
      
      <!-- Card Header -->
      <div class="card-header">
        <div class="flex items-start justify-between mb-3 gap-2">
          <h3 class="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
            <a href="${post.url}" class="hover:text-blue-700 break-words">${post.title}</a>
          </h3>
        </div>
        
        <!-- Categories -->
        <div class="mb-3 flex flex-wrap gap-1">
          ${categoryBadges}
        </div>
        
        <!-- Date with Icon -->
        <div class="flex items-center text-xs sm:text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
          <svg class="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h2A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4h2V2.75A.75.75 0 015.75 2zm0 2h-1a1.25 1.25 0 00-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-8.5c0-.69-.56-1.25-1.25-1.25h-1V6a.75.75 0 01-1.5 0V4H7v2a.75.75 0 01-1.5 0V4z" clip-rule="evenodd" />
          </svg>
          <span class="whitespace-nowrap">${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      <!-- Card Body -->
      <div class="card-body flex-grow">
        <p class="text-gray-600 leading-relaxed text-xs sm:text-sm group-hover:text-gray-700 transition-colors duration-300 line-clamp-3">
          ${post.description}
        </p>
      </div>

      <!-- Card Footer -->
      <div class="card-footer border-t border-gray-100 group-hover:border-blue-100 transition-colors duration-300">
        <div class="mb-4 flex flex-wrap gap-1 sm:gap-2">
          ${tagLinks}
          ${post.tags.length > 3 ? `<span class="text-gray-400 text-xs whitespace-nowrap">+${post.tags.length - 3}</span>` : ''}
        </div>
        <a href="${post.url}" class="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-all duration-300 group-hover:gap-2 text-xs sm:text-sm min-h-10 sm:min-h-12">
          Read Article
          <svg class="w-3 h-3 sm:w-4 sm:h-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>
    </div>
  `;
}

/**
 * Generate homepage with recent posts
 */
function generateHomepage(posts, pages, navigation) {
	const recentPosts = posts.slice(0, 6);

	const postCardsHtml = recentPosts
		.map(post => generatePostCard(post))
		.join('');

	const homeContent = `
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 md:py-32">
        <div class="text-center">
          <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 animate-fade-in leading-tight">
             Hello, I'm Khawarizmi Jefri
          </h1>
          <p class="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto animate-slide-in">
            Freelance developer passionate about building elegant solutions to complex problems. 
            Explore my work and latest articles below.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <a href="/contact/" class="btn btn-primary shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base min-h-11 sm:min-h-12">
              Get in Touch
            </a>
            <a href="/portfolio/" class="btn btn-secondary shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base min-h-11 sm:min-h-12">
              View My Work
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Recent Posts Section -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24">
      <div class="mb-8 sm:mb-12">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">Latest Articles</h2>
        <p class="text-sm sm:text-base md:text-lg text-gray-600">
          Insights, tutorials, and technical deep-dives from my development journey
        </p>
      </div>

      <!-- Post Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        ${postCardsHtml}
      </div>

      <!-- View All Button -->
      <div class="text-center">
        <a href="/posts/" class="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-base sm:text-lg transition-all duration-300 group hover:gap-3 min-h-10 sm:min-h-12">
          View All Articles
          <svg class="w-4 h-4 sm:w-5 sm:h-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 text-center">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 leading-tight">Ready to Start a Project?</h2>
        <p class="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8">
          Let's work together to bring your ideas to life
        </p>
        <a href="/contact/" class="btn btn-primary shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base lg:text-lg min-h-11 sm:min-h-12">
          Contact Me Today
        </a>
      </div>
    </section>
  `;

	const html = renderTemplate(
		'main',
		{
			title: config.siteTitle,
			main_content: homeContent,
		},
		navigation
	);

	return html;
}// ============================================
// NAVIGATION GENERATION
// ============================================

/**
 * Build navigation data structure from pages
 */
function buildNavigation(pages, posts) {
	const navigation = {
		home: {
			title: 'Home',
			url: '/',
		},
		pages: pages
			.sort((a, b) => a.title.localeCompare(b.title))
			.map(page => ({
				title: page.title,
				url: page.url,
			})),
		blog: {
			title: 'Blog',
			url: '/posts/',
			submenu: [
				{ title: 'All Posts', url: '/posts/' },
				{ title: 'Categories', url: '/categories/' },
				{ title: 'Tags', url: '/tags/' },
			],
		},
	};

	return navigation;
}

/**
 * Generate navigation HTML
 */
function generateNavigationHtml(navigation) {
	const pageLinksHtml = navigation.pages
		.map(
			page => `
            <a href="${page.url}" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition">
              ${page.title}
            </a>
          `
		)
		.join('');

	const blogSubmenuHtml = navigation.blog.submenu
		.map(
			item => `
        <a href="${item.url}" class="block text-gray-700 hover:text-blue-600 px-3 py-2 text-sm hover:bg-gray-100 transition">
          ${item.title}
        </a>
      `
		)
		.join('');

	return `
    <nav class="bg-white shadow-md hover:shadow-lg sticky top-0 z-50 transition-shadow duration-300">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo/Brand -->
          <div class="flex-shrink-0">
            <a href="/" class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
              Khawarizmi
            </a>
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-1">
              <a href="/" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-blue-50">
                Home
              </a>
              ${pageLinksHtml}
              <div class="relative group">
                <a href="/posts/" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-blue-50 flex items-center">
                  Blog
                  <svg class="w-4 h-4 ml-1 transform transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                  </svg>
                </a>
                <div class="hidden group-hover:block absolute left-0 mt-0 bg-white shadow-xl rounded-lg py-2 w-48 transform transition-all duration-300 opacity-0 group-hover:opacity-100">
                  ${blogSubmenuHtml}
                </div>
              </div>
            </div>
          </div>

          <!-- Mobile menu button -->
          <div class="md:hidden">
            <button class="text-gray-700 hover:text-blue-600 focus:outline-none transition-colors duration-200 hover:bg-blue-50 p-2 rounded-md">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  `;
}

// ============================================
// TAG & CATEGORY PROCESSING
// ============================================

/**
 * Index posts by tags and categories
 */
function indexPostsByTagsAndCategories(posts) {
	const tagIndex = {};
	const categoryIndex = {};

	posts.forEach(post => {
		// Index by tags
		post.tags.forEach(tag => {
			if (!tagIndex[tag]) {
				tagIndex[tag] = [];
			}
			tagIndex[tag].push(post);
		});

		// Index by categories
		post.categories.forEach(category => {
			if (!categoryIndex[category]) {
				categoryIndex[category] = [];
			}
			categoryIndex[category].push(post);
		});
	});

	return { tagIndex, categoryIndex };
}

/**
 * Slugify tag/category name for URL
 */
function slugifyTag(tag) {
	return tag.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

/**
 * Generate post list HTML
 */
function generatePostListHtml(posts, title) {
	const postsHtml = posts
		.map(post => `
      <article class="card mb-6 transform transition-all duration-300 hover:-translate-y-1 group">
        <div class="card-header">
          <h2 class="text-2xl font-bold mb-2 group-hover:text-blue-600 transition-colors duration-300">
            <a href="${post.url}" class="hover:text-blue-700">${post.title}</a>
          </h2>
          <div class="flex items-center gap-3 text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h2A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4h2V2.75A.75.75 0 015.75 2zm0 2h-1a1.25 1.25 0 00-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-8.5c0-.69-.56-1.25-1.25-1.25h-1V6a.75.75 0 01-1.5 0V4H7v2a.75.75 0 01-1.5 0V4z" clip-rule="evenodd" />
            </svg>
            ${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            ${post.categories.length > 0 ? `<span class="text-xs badge badge-primary ml-2">${post.categories[0]}</span>` : ''}
          </div>
        </div>
        <div class="card-body">
          <p class="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">${post.description}</p>
        </div>
        <div class="card-footer">
          <div class="flex flex-wrap gap-2 mb-3">
            ${post.tags.slice(0, 5).map(t => `<a href="/tags/${slugifyTag(t)}/" class="text-xs text-blue-600 hover:text-blue-700 transition-colors duration-200 hover:underline">#${t}</a>`).join(' ')}
            ${post.tags.length > 5 ? `<span class="text-xs text-gray-400">+${post.tags.length - 5}</span>` : ''}
          </div>
          <a href="${post.url}" class="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-all duration-300 group-hover:gap-2">
            Read Full Article
            <svg class="w-4 h-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </a>
        </div>
      </article>
    `)
		.join('');

	return `
    <div class="max-w-3xl mx-auto px-4 py-12">
      <h1 class="text-4xl font-bold mb-8">${title}</h1>
      ${postsHtml}
    </div>
  `;
}

// ============================================
// POSTS ARCHIVE
// ============================================

/**
 * Generate posts archive page
 */
function generatePostsArchive(posts, navigation) {
	const archiveContent = generatePostListHtml(posts, 'Blog Posts');

	const html = renderTemplate(
		'main',
		{
			title: 'Blog - ' + config.siteTitle,
			main_content: archiveContent,
		},
		navigation
	);

	return html;
}

// ============================================
// TAGS & CATEGORIES PAGES
// ============================================

/**
 * Generate tags listing page
 */
function generateTagsPage(tagIndex, navigation) {
	const tagsHtml = Object.keys(tagIndex)
		.sort()
		.map(tag => {
			const count = tagIndex[tag].length;
			return `
        <div class="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 class="text-xl font-bold mb-2">
            <a href="/tags/${slugifyTag(tag)}/" class="text-blue-600 hover:text-blue-800">${tag}</a>
          </h3>
          <p class="text-gray-600">${count} ${count === 1 ? 'post' : 'posts'}</p>
        </div>
      `;
		})
		.join('');

	const tagsContent = `
    <div class="max-w-3xl mx-auto px-4 py-12">
      <h1 class="text-4xl font-bold mb-8">Tags</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${tagsHtml}
      </div>
    </div>
  `;

	const html = renderTemplate(
		'main',
		{
			title: 'Tags - ' + config.siteTitle,
			main_content: tagsContent,
		},
		navigation
	);

	return html;
}

/**
 * Generate categories listing page
 */
function generateCategoriesPage(categoryIndex, navigation) {
	const categoriesHtml = Object.keys(categoryIndex)
		.sort()
		.map(category => {
			const count = categoryIndex[category].length;
			return `
        <div class="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 class="text-xl font-bold mb-2">
            <a href="/categories/${slugifyTag(category)}/" class="text-blue-600 hover:text-blue-800">${category}</a>
          </h3>
          <p class="text-gray-600">${count} ${count === 1 ? 'post' : 'posts'}</p>
        </div>
      `;
		})
		.join('');

	const categoriesContent = `
    <div class="max-w-3xl mx-auto px-4 py-12">
      <h1 class="text-4xl font-bold mb-8">Categories</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${categoriesHtml}
      </div>
    </div>
  `;

	const html = renderTemplate(
		'main',
		{
			title: 'Categories - ' + config.siteTitle,
			main_content: categoriesContent,
		},
		navigation
	);

	return html;
}

/**
 * Generate individual tag page
 */
function generateTagPage(tag, posts, navigation) {
	const title = `Posts tagged with "${tag}"`;
	const content = generatePostListHtml(posts, title);

	const html = renderTemplate(
		'main',
		{
			title: `${tag} - ` + config.siteTitle,
			main_content: content,
		},
		navigation
	);

	return html;
}

/**
 * Generate individual category page
 */
function generateCategoryPage(category, posts, navigation) {
	const title = `Posts in category "${category}"`;
	const content = generatePostListHtml(posts, title);

	const html = renderTemplate(
		'main',
		{
			title: `${category} - ` + config.siteTitle,
			main_content: content,
		},
		navigation
	);

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

	// Build navigation structure
	console.log('🧭 Building navigation...');
	const navigation = buildNavigation(pages, posts);
	console.log('✓ Navigation structure created\n');

	// Generate pages
	console.log('📝 Generating pages...');
	pages.forEach(page => {
		const html = generatePage(page, 'main', navigation);
		savePage(page, html);
	});
	console.log();

	// Generate posts
	console.log('📰 Generating blog posts...');
	posts.forEach(post => {
		const html = generatePage(post, 'main', navigation);
		savePage(post, html);
	});
	console.log();

	// Generate homepage
	console.log('🏠 Generating homepage...');
	const homepageHtml = generateHomepage(posts, pages, navigation);
	writeFile(path.join(config.publicDir, 'index.html'), homepageHtml);
	console.log('✓ Generated: /\n');

	// Generate posts archive
	console.log('📚 Generating posts archive...');
	const archiveHtml = generatePostsArchive(posts, navigation);
	writeFile(path.join(config.publicDir, 'posts', 'index.html'), archiveHtml);
	console.log('✓ Generated: /posts/\n');

	// Index posts by tags and categories
	console.log('🏷️  Indexing tags and categories...');
	const { tagIndex, categoryIndex } = indexPostsByTagsAndCategories(posts);
	console.log(`   Found ${Object.keys(tagIndex).length} tags and ${Object.keys(categoryIndex).length} categories\n`);

	// Generate tags page
	console.log('🏷️  Generating tags page...');
	const tagsPageHtml = generateTagsPage(tagIndex, navigation);
	writeFile(path.join(config.publicDir, 'tags', 'index.html'), tagsPageHtml);
	console.log('✓ Generated: /tags/\n');

	// Generate categories page
	console.log('📂 Generating categories page...');
	const categoriesPageHtml = generateCategoriesPage(categoryIndex, navigation);
	writeFile(path.join(config.publicDir, 'categories', 'index.html'), categoriesPageHtml);
	console.log('✓ Generated: /categories/\n');

	// Generate individual tag pages
	console.log('🏷️  Generating individual tag pages...');
	Object.keys(tagIndex).forEach(tag => {
		const tagHtml = generateTagPage(tag, tagIndex[tag], navigation);
		const tagSlug = slugifyTag(tag);
		writeFile(path.join(config.publicDir, 'tags', tagSlug, 'index.html'), tagHtml);
		console.log(`✓ Generated: /tags/${tagSlug}/`);
	});
	console.log();

	// Generate individual category pages
	console.log('📂 Generating individual category pages...');
	Object.keys(categoryIndex).forEach(category => {
		const categoryHtml = generateCategoryPage(category, categoryIndex[category], navigation);
		const categorySlug = slugifyTag(category);
		writeFile(path.join(config.publicDir, 'categories', categorySlug, 'index.html'), categoryHtml);
		console.log(`✓ Generated: /categories/${categorySlug}/`);
	});
	console.log();

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

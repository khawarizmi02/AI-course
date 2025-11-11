# My Porfolio

## About
This is a portfolio and bloggin website using static site generator

this project will have these following criteria:

- content of the website will be in /content folder
- in the `/content` folder, we will have `/posts` folder which holds blog posts in markdown format. there is also `/pages` folder which holds normal pages
- the `/template` folder will hold the templates for this website in the HTML format.
- the template folder will have these following files:
	- `main.html` for main overall layout
	- navigation.html for main menu
	- footer.html for bottom footer
- the templating engine will use the following code snippet:
	- `{{ include:<filename> }}` calls other template file
	- `{{ main_content }}` calls the main content from posts of pages
- we will have a static site generator script in the `/src` folder.
- the static site generator will generate the static files for the website into `/public` folder
- the static site generator will generate files from the `/content` folder and user the templates from the `/template` folder
- make the frontend website using tailwind css and shadcn component library.

### component library
- does not use any front end javascript library
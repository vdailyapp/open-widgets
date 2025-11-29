# Project Overview

This is a web project that provides a collection of beautiful, customizable, and embeddable widgets. It's built with [Astro](https://astro.build/), a modern web framework for building fast, content-focused websites. The project leverages multiple popular front-end libraries, including [React](https://react.dev/), [Svelte](https://svelte.dev/), and [Vue](https://vuejs.org/), to create a diverse set of interactive widgets.

The project is styled with [Tailwind CSS](https://tailwindcss.com/), a utility-first CSS framework, and integrates the [shadcn/ui](https://ui.shadcn.com/) component library for a consistent and modern look and feel. This combination allows for rapid development of beautiful and responsive user interfaces.

The project is structured to be easily extensible, with each widget having its own dedicated page in the `src/pages` directory and its source code located in the `src/widgets` directory. This modular architecture makes it simple to add new widgets or modify existing ones.

## Building and Running

To get the project up and running locally, follow these steps:

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Start the development server:**

    ```bash
    npm run dev
    ```

    This will start a local development server at `http://localhost:4321`.

3.  **Build for production:**

    ```bash
    npm run build
    ```

    This will build the production-ready site to the `./dist/` directory.

4.  **Preview the production build:**

    ```bash
    npm run preview
    ```

    This will start a local server to preview the production build.

## Development Conventions

*   **Frameworks:** The project uses Astro as the main framework, with components written in React, Svelte, and Vue.
*   **Styling:** Tailwind CSS is used for styling, along with the shadcn/ui component library.
*   **Project Structure:**
    *   `src/pages`: Contains the Astro pages for each widget.
    *   `src/components`: Contains reusable UI components.
    *   `src/widgets`: Contains the source code for the widgets.
    *   `src/lib`: Contains utility functions.
*   **Creating a New Widget Page:** To create a new widget that is automatically discovered by the widget management page (`/widget-management`), you must add a new `.astro` file in the `src/pages` directory with the following frontmatter:
    ```javascript
    ---
    // src/pages/my-new-widget.astro
    import Layout from "../layouts/Layout.astro";
    import MyWidgetComponent from "../widgets/my-widget";

    export const isWidget = true;
    export const title = "My New Widget";
    export const description = "A short and sweet description of what this widget does.";
    export const category = "Productivity"; // Or any other relevant category
    export const icon = "🚀"; // An emoji to represent the widget
    ---

    <Layout title={title}>
      <MyWidgetComponent client:load />
    </Layout>
    ```
*   **Linting and Formatting:** TODO: Add information about linting and formatting conventions.
*   **Testing:** TODO: Add information about the testing strategy.

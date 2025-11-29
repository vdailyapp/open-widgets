// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import svelte from "@astrojs/svelte";

import vue from "@astrojs/vue";

import tailwind from "@astrojs/tailwind";

import monacoEditorPlugin from 'vite-plugin-monaco-editor';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(), 
    svelte(), 
    vue(),
    tailwind({
      configFile: './tailwind.config.js'
    })
  ],
  vite: {
    plugins: [
      monacoEditorPlugin.default({
        languageWorkers: ['editorWorkerService'],
        customWorkers: []
      })
    ],
    optimizeDeps: {
      include: ['monaco-editor']
    }
  }
});

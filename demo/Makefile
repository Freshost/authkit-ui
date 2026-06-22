# authkit-ui demo (frontend) — Vite on :5173, proxies /api → the backend on
# :8099. Consumes @freshost/authkit-ui from ../src (aliased in vite.config.ts).

.PHONY: help install dev build preview lint

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pnpm install

dev: ## Run the dev server (http://localhost:5173)
	pnpm dev

build: ## Type-check + production build
	pnpm build

preview: ## Preview the production build
	pnpm preview

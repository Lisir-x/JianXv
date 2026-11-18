import { defineConfig } from '@playwright/test'
export default defineConfig({ testDir:'tests/e2e', workers:1, timeout:120000, expect:{timeout:10000}, reporter:'list', use:{trace:'retain-on-failure',actionTimeout:15000} })

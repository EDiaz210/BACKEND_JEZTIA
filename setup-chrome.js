#!/usr/bin/env node
/**
 * setup-chrome.js
 * Script para asegurar que Chrome se descarga correctamente en Render
 */

import { execSync } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';

const isRender = process.env.RENDER === 'true';
const cacheDir = process.env.PUPPETEER_CACHE_DIR || 
  path.join(process.env.HOME || os.homedir(), '.cache', 'puppeteer');

console.log('[SETUP] Iniciando configuración de Chrome...');
console.log(`[SETUP] Cache directory: ${cacheDir}`);
console.log(`[SETUP] Render environment: ${isRender}`);

try {
  // Asegurar que el directorio existe
  if (!fs.existsSync(cacheDir)) {
    console.log(`[SETUP] Creando directorio de caché: ${cacheDir}`);
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // Ejecutar el comando de instalación de Puppeteer
  console.log('[SETUP] Descargando Chrome con Puppeteer...');
  execSync('npx puppeteer@latest browsers install chrome', {
    stdio: 'inherit',
    env: {
      ...process.env,
      PUPPETEER_CACHE_DIR: cacheDir,
      PUPPETEER_SKIP_DOWNLOAD: 'false',
    }
  });

  console.log('[SETUP] ✅ Chrome descargado exitosamente');
  process.exit(0);
} catch (error) {
  console.error('[SETUP] ❌ Error descargando Chrome:', error.message);
  console.error('[SETUP] Continuando de todas formas...');
  process.exit(0); // No fallar el build si hay problemas
}

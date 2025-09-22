#!/usr/bin/env node

// Complete Cloudflare deployment automation
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

console.log('🚀 Starting Cloudflare deployment...');

async function deploy() {
  try {
    // Check if wrangler is installed
    try {
      await execAsync('npx wrangler --version');
    } catch {
      console.log('📦 Installing Wrangler...');
      await execAsync('npm install -g wrangler');
    }
    
    // Create R2 bucket
    console.log('🪣 Creating R2 bucket...');
    try {
      await execAsync('npx wrangler r2 bucket create cutgluebuild-templates');
    } catch (e) {
      console.log('   (Bucket may already exist)');
    }
    
    // Upload templates to R2
    console.log('📤 Uploading templates to R2...');
    await execAsync('npx wrangler r2 object put cutgluebuild-templates/templates --file=templates --recursive');
    
    // Deploy Worker
    console.log('⚡ Deploying Worker API...');
    await execAsync('npx wrangler deploy');
    
    console.log('✅ Deployment complete!');
    console.log('🌐 Your API is live at: https://cutgluebuild-api.your-subdomain.workers.dev');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

deploy();

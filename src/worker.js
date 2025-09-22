// CutGlueBuild Template API Worker
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // API Routes
      if (url.pathname === '/api/templates') {
        return await handleTemplatesList(request, env);
      } else if (url.pathname.startsWith('/api/templates/')) {
        return await handleTemplateDownload(request, env, url.pathname);
      } else if (url.pathname === '/api/search') {
        return await handleTemplateSearch(request, env);
      } else if (url.pathname === '/api/metadata') {
        return await handleMetadata(request, env);
      } else if (url.pathname === '/api/categories') {
        return await handleCategories(request, env);
      } else if (url.pathname === '/') {
        return await handleHomePage(request, env);
      } else {
        return new Response('API Endpoint Not Found', { 
          status: 404, 
          headers: corsHeaders 
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handleHomePage(request, env) {
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>CutGlueBuild Template API</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .method { color: #0066cc; font-weight: bold; }
    </style>
</head>
<body>
    <h1>🔧 CutGlueBuild Template API</h1>
    <p>Legally compliant open source templates for laser cutting, CNC, and Shaper Origin</p>
    
    <h2>Available Endpoints:</h2>
    
    <div class="endpoint">
        <span class="method">GET</span> <code>/api/templates</code> - List all templates
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <code>/api/templates/{path}</code> - Download specific template
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <code>/api/search?q={query}&category={category}</code> - Search templates
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <code>/api/categories</code> - List template categories
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <code>/api/metadata</code> - Collection metadata
    </div>
    
    <h2>Legal Compliance:</h2>
    <p>All templates are verified to have compatible open source licenses allowing commercial use and modification.</p>
    <p>See <code>/api/metadata</code> for detailed license information.</p>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

async function handleTemplatesList(request, env) {
  const templates = await listTemplatesFromR2(env);
  return new Response(JSON.stringify({
    total: templates.length,
    templates: templates
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleTemplateDownload(request, env, pathname) {
  const templatePath = pathname.replace('/api/templates/', '');
  const file = await env.TEMPLATES_BUCKET.get(templatePath);
  
  if (!file) {
    return new Response('Template not found', { 
      status: 404,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  const filename = templatePath.split('/').pop();
  
  return new Response(file.body, {
    headers: {
      'Content-Type': file.httpMetadata?.contentType || getContentType(templatePath),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleTemplateSearch(request, env) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const license = url.searchParams.get('license');
  const query = url.searchParams.get('q');
  const type = url.searchParams.get('type'); // svg or dxf
  
  const results = await searchTemplates(env, { category, license, query, type });
  
  return new Response(JSON.stringify({
    query: { category, license, query, type },
    total: results.length,
    results: results
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleCategories(request, env) {
  const categories = [
    { name: 'boxes', description: 'Storage containers and enclosures' },
    { name: 'decorative', description: 'Artistic and ornamental designs' }, 
    { name: 'functional', description: 'Mechanical parts and tools' },
    { name: 'educational', description: 'Learning projects and demonstrations' },
    { name: 'robotics', description: 'Robot parts and mechanical assemblies' },
    { name: 'furniture', description: 'Large-scale furniture components' }
  ];
  
  return new Response(JSON.stringify({ categories }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleMetadata(request, env) {
  const metadata = {
    version: '1.0.0',
    totalTemplates: await countTemplates(env),
    categories: ['boxes', 'decorative', 'functional', 'educational', 'robotics', 'furniture'],
    fileTypes: ['svg', 'dxf'],
    licenses: ['CC0', 'MIT', 'GPL v3+', 'CC BY', 'CC BY-SA', 'CC Share-alike 3.0'],
    legalCompliance: {
      commercialUseAllowed: true,
      modificationAllowed: true,
      redistributionAllowed: true,
      attributionTracked: true
    },
    sources: [
      { name: '3CatMax LaserFiles', license: 'CC0', files: '~50' },
      { name: 'Boxes.py', license: 'GPL v3+', files: '100+' },
      { name: 'MeArm', license: 'CC Share-alike 3.0', files: '~20' },
      { name: 'frank26080115 projects', license: 'MIT', files: '~30' }
    ],
    lastUpdated: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(metadata), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function listTemplatesFromR2(env) {
  const list = await env.TEMPLATES_BUCKET.list();
  return list.objects.map(obj => ({
    name: obj.key,
    size: obj.size,
    modified: obj.uploaded,
    category: getCategoryFromPath(obj.key),
    type: getFileType(obj.key),
    downloadUrl: `/api/templates/${obj.key}`
  }));
}

async function searchTemplates(env, filters) {
  const allTemplates = await listTemplatesFromR2(env);
  
  return allTemplates.filter(template => {
    if (filters.category && template.category !== filters.category) return false;
    if (filters.type && template.type !== filters.type) return false;
    if (filters.query) {
      const query = filters.query.toLowerCase();
      if (!template.name.toLowerCase().includes(query)) return false;
    }
    return true;
  });
}

async function countTemplates(env) {
  const list = await env.TEMPLATES_BUCKET.list();
  return list.objects.length;
}

function getCategoryFromPath(path) {
  const parts = path.split('/');
  if (parts[0] === 'templates' && parts[1] === 'by-category') {
    return parts[2] || 'uncategorized';
  }
  if (parts[0] === 'templates' && parts[1] === 'generated') {
    return 'boxes';
  }
  return 'uncategorized';
}

function getFileType(path) {
  const ext = path.split('.').pop()?.toLowerCase();
  return ext === 'svg' ? 'svg' : ext === 'dxf' ? 'dxf' : 'unknown';
}

function getContentType(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'svg': return 'image/svg+xml';
    case 'dxf': return 'application/dxf';
    default: return 'application/octet-stream';
  }
}

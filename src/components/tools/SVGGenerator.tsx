import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Wand2, 
  Download, 
  Loader2, 
  Settings,
  Image,
  CheckCircle
} from 'lucide-react';
import { useUser } from '../../store/authStore';

interface SVGGeneratorProps {
  onGenerate?: (svgData: string, metadata: any) => void;
}

interface GenerationSettings {
  description: string;
  material: string;
  width: number;
  height: number;
  style: string;
  complexity: string;
  cutType: string;
}

export default function SVGGenerator({ onGenerate }: SVGGeneratorProps) {
  const user = useUser();
  const [settings, setSettings] = useState<GenerationSettings>({
    description: '',
    material: 'wood',
    width: 100,
    height: 100,
    style: 'geometric',
    complexity: 'medium',
    cutType: 'cut'
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);

  const generateSVG = async () => {
    if (!settings.description.trim()) {
      toast.error('Please provide a description for your design');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/ai/generate-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          description: settings.description,
          material: settings.material,
          width: settings.width,
          height: settings.height,
          style: settings.style,
          complexity: settings.complexity
        })
      });

      if (!response.ok) throw new Error('Failed to generate SVG');

      const result = await response.json();
      const svgData = result.svgData;
      setGeneratedSvg(svgData);
      
      if (onGenerate) {
        onGenerate(svgData, {
          description: settings.description,
          material: settings.material,
          style: settings.style,
          dimensions: { width: settings.width, height: settings.height }
        });
      }
      
      toast.success('SVG generated successfully!');
      
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate SVG. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const createMockSVG = (settings: GenerationSettings): string => {
    const { width, height, style, complexity } = settings;
    
    let paths = '';
    
    if (style === 'geometric') {
      // Create geometric patterns
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 3;
      
      if (complexity === 'simple') {
        paths = `
          <rect x="10" y="10" width="${width-20}" height="${height-20}" fill="none" stroke="#000" stroke-width="1"/>
          <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#000" stroke-width="1"/>
        `;
      } else if (complexity === 'medium') {
        paths = `
          <rect x="10" y="10" width="${width-20}" height="${height-20}" fill="none" stroke="#000" stroke-width="1"/>
          <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#000" stroke-width="1"/>
          <polygon points="${centerX},${centerY-radius/2} ${centerX+radius/2},${centerY+radius/2} ${centerX-radius/2},${centerY+radius/2}" fill="none" stroke="#000" stroke-width="1"/>
        `;
      } else {
        // Complex geometric pattern
        const points = [];
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          points.push(`${x},${y}`);
        }
        
        paths = `
          <rect x="10" y="10" width="${width-20}" height="${height-20}" fill="none" stroke="#000" stroke-width="1"/>
          <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#000" stroke-width="1"/>
          <polygon points="${points.join(' ')}" fill="none" stroke="#000" stroke-width="1"/>
          <circle cx="${centerX}" cy="${centerY}" r="${radius/2}" fill="none" stroke="#000" stroke-width="1"/>
        `;
      }
    } else if (style === 'organic') {
      // Create organic/flowing patterns
      paths = `
        <path d="M20,${height/2} Q${width/4},20 ${width/2},${height/2} T${width-20},${height/2}" fill="none" stroke="#000" stroke-width="2"/>
        <path d="M${width/2},20 Q${width-20},${height/4} ${width/2},${height/2} T${width/2},${height-20}" fill="none" stroke="#000" stroke-width="2"/>
      `;
    } else if (style === 'minimal') {
      // Simple, clean lines
      paths = `
        <line x1="20" y1="20" x2="${width-20}" y2="${height-20}" stroke="#000" stroke-width="1"/>
        <line x1="${width-20}" y1="20" x2="20" y2="${height-20}" stroke="#000" stroke-width="1"/>
        <circle cx="${width/2}" cy="${height/2}" r="5" fill="#000"/>
      `;
    }

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .cut-line { stroke: #ff0000; stroke-width: 0.1; fill: none; }
            .engrave-line { stroke: #0000ff; stroke-width: 0.1; fill: none; }
          </style>
        </defs>
        ${paths}
        <text x="5" y="${height-5}" font-family="Arial" font-size="8" fill="#666" opacity="0.5">
          ${settings.description.substring(0, 30)}...
        </text>
      </svg>
    `;
  };

  const downloadSVG = () => {
    if (!generatedSvg) return;
    
    const blob = new Blob([generatedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="text-center">
          <Wand2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            AI SVG Generator
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sign in to generate custom SVG designs with AI.
          </p>
          <a href="/login" className="btn-primary inline-flex items-center">
            Sign In to Continue
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Wand2 className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI SVG Generator
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create custom laser-ready designs with AI
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Generation Settings
            </h4>
          </div>
            
            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Design Description
              </label>
              <textarea
                value={settings.description}
                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your design... e.g., 'A geometric mandala pattern for laser cutting on wood'"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            {/* Material */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Material
              </label>
              <select
                value={settings.material}
                onChange={(e) => setSettings(prev => ({ ...prev, material: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="wood">Wood</option>
                <option value="acrylic">Acrylic</option>
                <option value="cardboard">Cardboard</option>
                <option value="leather">Leather</option>
                <option value="fabric">Fabric</option>
                <option value="metal">Metal</option>
              </select>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Width (mm)
                </label>
                <input
                  type="number"
                  value={settings.width}
                  onChange={(e) => setSettings(prev => ({ ...prev, width: parseInt(e.target.value) || 100 }))}
                  min="10"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Height (mm)
                </label>
                <input
                  type="number"
                  value={settings.height}
                  onChange={(e) => setSettings(prev => ({ ...prev, height: parseInt(e.target.value) || 100 }))}
                  min="10"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Style */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'geometric', label: 'Geometric' },
                  { value: 'organic', label: 'Organic' },
                  { value: 'minimal', label: 'Minimal' },
                  { value: 'detailed', label: 'Detailed' }
                ].map(style => (
                  <label key={style.value} className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="style"
                      value={style.value}
                      checked={settings.style === style.value}
                      onChange={(e) => setSettings(prev => ({ ...prev, style: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{style.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Complexity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Complexity
              </label>
              <select
                value={settings.complexity}
                onChange={(e) => setSettings(prev => ({ ...prev, complexity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="simple">Simple</option>
                <option value="medium">Medium</option>
                <option value="complex">Complex</option>
              </select>
            </div>

            <button
              onClick={generateSVG}
              disabled={isGenerating || !settings.description.trim()}
              className="w-full btn btn-primary py-3 text-base font-medium"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating SVG...
                </>
              ) : (
                'Generate SVG'
              )}
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Preview</h3>
            {generatedSvg && (
              <button
                onClick={downloadSVG}
                className="btn btn-primary text-sm"
              >
                Download SVG
              </button>
            )}
          </div>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 min-h-96 flex items-center justify-center">
            {generatedSvg ? (
              <div 
                className="max-w-full max-h-full"
                dangerouslySetInnerHTML={{ __html: generatedSvg }}
              />
            ) : (
              <div className="text-center text-gray-400 dark:text-gray-600">
                <Image className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg font-medium">No design generated yet</p>
                <p className="text-sm">Fill out the form and click generate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
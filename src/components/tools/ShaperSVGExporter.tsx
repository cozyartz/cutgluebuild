import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Download, 
  Settings, 
  Layers, 
  Eye,
  AlertCircle,
  CheckCircle,
  FileText,
  Zap
} from 'lucide-react';
import { useUser } from '../../store/authStore';

interface ShaperSVGExporterProps {
  svgData?: string;
  projectTitle?: string;
  onShaperSVGGenerated?: (svg: string) => void;
}

interface ShaperCutType {
  id: string;
  name: string;
  color: string;
  description: string;
  strokeWidth: string;
}

interface ShaperSettings {
  material: string;
  thickness: number;
  cutTypes: { [key: string]: boolean };
  optimizeForShaper: boolean;
  includeGuides: boolean;
}

// Shaper Origin cut type color specifications
const SHAPER_CUT_TYPES: ShaperCutType[] = [
  {
    id: 'online',
    name: 'Online (Engrave)',
    color: '#0066FF', // Blue for engraving
    description: 'Surface engraving operations',
    strokeWidth: '0.1'
  },
  {
    id: 'exterior',
    name: 'Exterior Cut',
    color: '#FF0000', // Red for exterior cuts
    description: 'Cut out positive shapes at specified dimensions',
    strokeWidth: '0.1'
  },
  {
    id: 'interior',
    name: 'Interior Cut',
    color: '#00FF00', // Green for interior cuts
    description: 'Cut through-holes with dimensions equal to SVG shape',
    strokeWidth: '0.1'
  },
  {
    id: 'pocket',
    name: 'Pocket',
    color: '#FF00FF', // Magenta for pocket cuts
    description: 'Remove material within shape to specified depth',
    strokeWidth: '0.1'
  },
  {
    id: 'guide',
    name: 'Guide',
    color: '#888888', // Gray for guide marks
    description: 'Reference marks that are not cut',
    strokeWidth: '0.05'
  }
];

export default function ShaperSVGExporter({ svgData, projectTitle, onShaperSVGGenerated }: ShaperSVGExporterProps) {
  const user = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [shaperSVG, setShaperSVG] = useState<string | null>(null);
  const [settings, setSettings] = useState<ShaperSettings>({
    material: 'plywood',
    thickness: 3,
    cutTypes: {
      exterior: true,
      online: true,
      interior: false,
      pocket: false,
      guide: true
    },
    optimizeForShaper: true,
    includeGuides: true
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const materialPresets = {
    plywood: { thickness: 3 },
    acrylic: { thickness: 3 },
    cardboard: { thickness: 1.5 },
    mdf: { thickness: 6 },
    hardwood: { thickness: 6 }
  };

  const handleMaterialChange = (material: string) => {
    if (materialPresets[material as keyof typeof materialPresets]) {
      const preset = materialPresets[material as keyof typeof materialPresets];
      setSettings(prev => ({
        ...prev,
        material,
        thickness: preset.thickness
      }));
    } else {
      setSettings(prev => ({ ...prev, material }));
    }
  };

  const generateShaperSVG = async () => {
    if (!user) {
      toast.error('Please sign in to generate Shaper SVG');
      return;
    }

    if (!svgData) {
      toast.error('No SVG data provided');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-shaper-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          svgData,
          material: settings.material,
          settings
        })
      });

      if (!response.ok) throw new Error('Failed to generate Shaper SVG');

      const result = await response.json();
      setShaperSVG(result.svg);
      
      if (onShaperSVGGenerated) {
        onShaperSVGGenerated(result.svg);
      }

      toast.success('Shaper SVG generated successfully!');
    } catch (error) {
      console.error('Shaper SVG generation error:', error);
      toast.error('Failed to generate Shaper SVG');
    } finally {
      setIsGenerating(false);
    }
  };

  const convertToShaperSVG = () => {
    if (!svgData) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgData, 'image/svg+xml');
      const svg = doc.documentElement;

      // Apply Shaper-specific color encoding
      const paths = svg.querySelectorAll('path, circle, rect, line, polyline, polygon');
      
      paths.forEach((element) => {
        // Default to exterior cut if no specific type is set
        let cutType = 'exterior';
        
        // Apply color based on cut type
        const shaperCutType = SHAPER_CUT_TYPES.find(ct => ct.id === cutType);
        if (shaperCutType) {
          element.setAttribute('stroke', shaperCutType.color);
          element.setAttribute('stroke-width', shaperCutType.strokeWidth);
          element.setAttribute('fill', 'none');
        }
      });

      // Add Shaper-specific metadata
      svg.setAttribute('data-shaper-origin', 'true');
      svg.setAttribute('data-material', settings.material);
      svg.setAttribute('data-thickness', settings.thickness.toString());

      const serializer = new XMLSerializer();
      const shaperSVGString = serializer.serializeToString(svg);
      
      setShaperSVG(shaperSVGString);
      
      if (onShaperSVGGenerated) {
        onShaperSVGGenerated(shaperSVGString);
      }

      toast.success('SVG converted for Shaper Origin!');
    } catch (error) {
      console.error('SVG conversion error:', error);
      toast.error('Failed to convert SVG for Shaper');
    }
  };

  const downloadShaperSVG = () => {
    if (!shaperSVG) return;

    const blob = new Blob([shaperSVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle || 'project'}_shaper.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Shaper SVG downloaded!');
  };

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="text-center">
          <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Shaper SVG Exporter
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Convert your designs to Shaper Origin compatible SVG files with proper cut type encoding.
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
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Shaper SVG Exporter
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Optimize {projectTitle || 'your design'} for Shaper Origin
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={convertToShaperSVG}
              disabled={!svgData}
              className="btn-secondary flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Convert SVG</span>
            </button>
            
            <button
              onClick={generateShaperSVG}
              disabled={isGenerating || !svgData}
              className="btn-primary flex items-center space-x-2"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Generating...' : 'AI Optimize'}</span>
            </button>
          </div>
        </div>

        {/* Cut Type Legend */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Shaper Origin Cut Types
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SHAPER_CUT_TYPES.map((cutType) => (
              <div key={cutType.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div
                  className="w-4 h-4 border-2 rounded"
                  style={{ backgroundColor: cutType.color, borderColor: cutType.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {cutType.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {cutType.description}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.cutTypes[cutType.id] || false}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    cutTypes: { ...prev.cutTypes, [cutType.id]: e.target.checked }
                  }))}
                  className="rounded text-blue-600"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Material Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Material
            </label>
            <select
              value={settings.material}
              onChange={(e) => handleMaterialChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="plywood">Plywood</option>
              <option value="acrylic">Acrylic</option>
              <option value="cardboard">Cardboard</option>
              <option value="mdf">MDF</option>
              <option value="hardwood">Hardwood</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thickness (mm)
            </label>
            <input
              type="number"
              value={settings.thickness}
              onChange={(e) => setSettings(prev => ({ ...prev, thickness: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              min="0.1"
              step="0.1"
            />
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="mb-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Settings className="w-4 h-4" />
            <span>Advanced Settings</span>
          </button>
        </div>

        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Optimize for Shaper Origin
              </label>
              <input
                type="checkbox"
                checked={settings.optimizeForShaper}
                onChange={(e) => setSettings(prev => ({ ...prev, optimizeForShaper: e.target.checked }))}
                className="rounded text-blue-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Include Guide Lines
              </label>
              <input
                type="checkbox"
                checked={settings.includeGuides}
                onChange={(e) => setSettings(prev => ({ ...prev, includeGuides: e.target.checked }))}
                className="rounded text-blue-600"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Shaper SVG Output */}
      {shaperSVG && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Shaper-Ready SVG
            </h4>
            <button
              onClick={downloadShaperSVG}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download SVG</span>
            </button>
          </div>

          {/* Preview */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Preview
              </span>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center min-h-32">
              <div dangerouslySetInnerHTML={{ __html: shaperSVG }} className="max-w-full max-h-64" />
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Ready for Shaper Origin
                </h5>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Colors are encoded for different cut operations</li>
                  <li>• Transfer this SVG file to your Shaper Origin device</li>
                  <li>• Set cut depths manually on the device as needed</li>
                  <li>• Test settings on scrap material first</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
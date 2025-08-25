import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Code, 
  Download, 
  Settings, 
  Clock, 
  Gauge, 
  AlertCircle,
  CheckCircle,
  Play,
  FileText,
  Zap
} from 'lucide-react';
import { useUser } from '../../store/authStore';
import type { GCodeOutput } from '../../lib/cloudflare-ai';

interface GCodeGeneratorProps {
  svgData?: string;
  projectTitle?: string;
  onGCodeGenerated?: (gcode: string) => void;
}

interface MachineSettings {
  machineType: 'laser' | 'cnc' | 'plasma';
  material: string;
  thickness: number;
  feedRate: number;
  laserPower?: number;
  spindleSpeed?: number;
  passes: number;
}

export default function GCodeGenerator({ svgData, projectTitle, onGCodeGenerated }: GCodeGeneratorProps) {
  const user = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [gCodeOutput, setGCodeOutput] = useState<GCodeOutput | null>(null);
  const [settings, setSettings] = useState<MachineSettings>({
    machineType: 'laser',
    material: 'plywood',
    thickness: 3,
    feedRate: 1000,
    laserPower: 80,
    passes: 1
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const materialPresets = {
    plywood: { feedRate: 1000, laserPower: 75, passes: 1 },
    acrylic: { feedRate: 800, laserPower: 85, passes: 1 },
    cardboard: { feedRate: 1500, laserPower: 60, passes: 1 },
    mdf: { feedRate: 900, laserPower: 80, passes: 1 },
    hardwood: { feedRate: 600, laserPower: 90, passes: 2 }
  };

  const handleMaterialChange = (material: string) => {
    if (materialPresets[material as keyof typeof materialPresets]) {
      const preset = materialPresets[material as keyof typeof materialPresets];
      setSettings(prev => ({
        ...prev,
        material,
        feedRate: preset.feedRate,
        laserPower: preset.laserPower,
        passes: preset.passes
      }));
    } else {
      setSettings(prev => ({ ...prev, material }));
    }
  };

  const generateGCode = async () => {
    if (!user) {
      toast.error('Please sign in to generate G-code');
      return;
    }

    if (!svgData) {
      toast.error('No SVG data provided');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-gcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          svgData,
          material: settings.material,
          machineType: settings.machineType,
          settings
        })
      });

      if (!response.ok) throw new Error('Failed to generate G-code');

      const result = await response.json();
      setGCodeOutput(result);
      
      if (onGCodeGenerated) {
        onGCodeGenerated(result.gcode);
      }

      toast.success('G-code generated successfully!');
    } catch (error) {
      console.error('G-code generation error:', error);
      toast.error('Failed to generate G-code');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadGCode = () => {
    if (!gCodeOutput) return;

    const blob = new Blob([gCodeOutput.gcode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle || 'project'}_${settings.machineType}.gcode`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('G-code downloaded!');
  };

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="text-center">
          <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            G-Code Generator
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Convert your SVG designs to optimized G-code for CNC machines and laser cutters.
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
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Code className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                G-Code Generator
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-optimized machine code for {projectTitle || 'your design'}
              </p>
            </div>
          </div>

          <button
            onClick={generateGCode}
            disabled={isGenerating || !svgData}
            className="btn-primary flex items-center space-x-2"
          >
            {isGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isGenerating ? 'Generating...' : 'Generate G-Code'}</span>
          </button>
        </div>

        {/* Machine Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Machine Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Machine Type
            </label>
            <select
              value={settings.machineType}
              onChange={(e) => setSettings(prev => ({ ...prev, machineType: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="laser">Laser Cutter</option>
              <option value="cnc">CNC Router</option>
              <option value="plasma">Plasma Cutter</option>
            </select>
          </div>

          {/* Material */}
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

          {/* Thickness */}
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

        {/* Advanced Settings Toggle */}
        <div className="mb-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Settings className="w-4 h-4" />
            <span>Advanced Settings</span>
          </button>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feed Rate (mm/min)
              </label>
              <input
                type="number"
                value={settings.feedRate}
                onChange={(e) => setSettings(prev => ({ ...prev, feedRate: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                min="100"
                step="100"
              />
            </div>

            {settings.machineType === 'laser' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Laser Power (%)
                </label>
                <input
                  type="number"
                  value={settings.laserPower}
                  onChange={(e) => setSettings(prev => ({ ...prev, laserPower: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  min="1"
                  max="100"
                />
              </div>
            )}

            {settings.machineType === 'cnc' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Spindle Speed (RPM)
                </label>
                <input
                  type="number"
                  value={settings.spindleSpeed || 10000}
                  onChange={(e) => setSettings(prev => ({ ...prev, spindleSpeed: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  min="1000"
                  step="1000"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Passes
              </label>
              <input
                type="number"
                value={settings.passes}
                onChange={(e) => setSettings(prev => ({ ...prev, passes: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                min="1"
                max="10"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* G-Code Output */}
      {gCodeOutput && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
        >
          {/* Output Header */}
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Generated G-Code
            </h4>
            <button
              onClick={downloadGCode}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Estimated Time</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {gCodeOutput.estimatedTime}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Gauge className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Material Usage</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {gCodeOutput.materialUsage}%
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Cutting Path</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Optimized
                </p>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {gCodeOutput.warnings.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Important Warnings
                </span>
              </div>
              <div className="space-y-2">
                {gCodeOutput.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-orange-700 dark:text-orange-300">{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* G-Code Preview */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                G-Code Preview
              </span>
            </div>
            <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 dark:text-gray-400 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                {gCodeOutput.gcode.split('\n').slice(0, 50).join('\n')}
                {gCodeOutput.gcode.split('\n').length > 50 && '\n... (truncated)'}
              </pre>
            </div>
          </div>

          {/* Success Message */}
          <div className="mt-4 flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>G-code generated successfully and ready for use</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
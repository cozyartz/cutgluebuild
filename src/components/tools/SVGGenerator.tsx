import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Wand2, Download, Loader2, Crown } from 'lucide-react';
import { useUser, useSubscriptionTier, useUsageLimits } from '../../store/authStore';
import { hasFeatureAccess, getUsageLimit } from '../../lib/pricing';

interface SVGGeneratorProps {
  onGenerate?: (svgData: string, metadata: any) => void;
}

export default function SVGGenerator({ onGenerate }: SVGGeneratorProps) {
  const user = useUser();
  const tier = useSubscriptionTier();
  const limits = useUsageLimits();
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  const [usedToday, setUsedToday] = useState(0); // This should come from usage tracking

  const hasSubscription = tier !== null;
  const canGenerate = hasSubscription && (limits.ai_designs === -1 || usedToday < limits.ai_designs);
  const remainingGenerations = limits.ai_designs === -1 ? '∞' : Math.max(0, limits.ai_designs - usedToday);

  const generateSVG = async () => {
    if (!description.trim()) {
      toast.error('Please provide a description for your design');
      return;
    }

    if (!canGenerate) {
      toast.error(`You've reached your limit of ${limits.ai_designs} designs. Upgrade to continue!`);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          description,
          material: 'wood',
          width: 100,
          height: 100,
          style: 'modern',
          complexity: 'medium'
        })
      });

      if (!response.ok) throw new Error('Failed to generate SVG');
      
      const data = await response.json();
      setGeneratedSvg(data.svgData);
      setUsedToday(prev => prev + 1); // Update usage count
      
      if (onGenerate) {
        onGenerate(data.svgData, { description, material: 'wood' });
      }
      
      toast.success('SVG design generated successfully!');
    } catch (error) {
      console.error('SVG generation error:', error);
      toast.error('Failed to generate SVG design');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSVG = () => {
    if (!generatedSvg) return;
    
    const blob = new Blob([generatedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-design.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user || !hasSubscription) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="text-center">
          <Wand2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            AI SVG Generator
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {!user 
              ? 'Sign in and choose a plan to generate custom laser-ready SVG designs with AI'
              : 'Subscribe to a plan to generate custom laser-ready SVG designs with AI'
            }
          </p>
          <div className="space-y-2">
            <a href="/pricing" className="btn-primary inline-flex items-center w-full justify-center">
              Choose Your Plan
            </a>
            {!user && (
              <a href="/login" className="btn-outline inline-flex items-center w-full justify-center">
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Wand2 className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              AI SVG Generator
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create custom laser-ready designs with AI
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {tier === 'professional' && <Crown className="w-4 h-4 text-yellow-500 inline mr-1" />}
              {tier && tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
            </div>
            {tier && (
              <div className="text-xs text-gray-500">
                {remainingGenerations} generations left
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Design Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your design... e.g., 'A geometric mandala pattern for laser cutting'"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>
            
            <button
              onClick={generateSVG}
              disabled={isGenerating || !description.trim() || !canGenerate}
              className={`w-full btn-primary flex items-center justify-center space-x-2 ${
                !canGenerate ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate SVG</span>
                </>
              )}
            </button>
            
            {!canGenerate && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You've reached your limit. 
                  <a href="/pricing" className="underline font-medium ml-1">
                    Upgrade to continue generating designs
                  </a>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Preview</h4>
              {generatedSvg && (
                <button
                  onClick={downloadSVG}
                  className="btn btn-primary text-sm flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              )}
            </div>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 min-h-64 flex items-center justify-center">
              {generatedSvg ? (
                <div 
                  className="max-w-full max-h-full"
                  dangerouslySetInnerHTML={{ __html: generatedSvg }}
                />
              ) : (
                <div className="text-center text-gray-400 dark:text-gray-600">
                  <p className="text-lg font-medium">No design generated yet</p>
                  <p className="text-sm">Fill out the description and click generate</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
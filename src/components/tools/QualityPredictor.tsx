import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Settings,
  Zap,
  Clock,
  Shield
} from 'lucide-react';
import { useUser } from '../../store/authStore';
import type { QualityPrediction } from '../../lib/cloudflare-ai';

interface QualityPredictorProps {
  svgData?: string;
  material?: string;
  settings?: any;
  onPredictionComplete?: (prediction: QualityPrediction) => void;
}

export default function QualityPredictor({ 
  svgData, 
  material = 'plywood', 
  settings = {}, 
  onPredictionComplete 
}: QualityPredictorProps) {
  const user = useUser();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<QualityPrediction | null>(null);
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  // Auto-analyze when SVG data changes
  useEffect(() => {
    if (svgData && autoAnalyze && user) {
      analyzePrediction();
    }
  }, [svgData, material, settings, autoAnalyze, user]);

  const analyzePrediction = async () => {
    if (!user) {
      toast.error('Please sign in to analyze quality');
      return;
    }

    if (!svgData) {
      toast.error('No design data provided');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          svgData,
          material,
          settings
        })
      });

      if (!response.ok) throw new Error('Failed to analyze quality');

      const result = await response.json();
      setPrediction(result);
      
      if (onPredictionComplete) {
        onPredictionComplete(result);
      }

      if (result.successProbability >= 85) {
        toast.success('High quality prediction - ready to fabricate!');
      } else if (result.successProbability >= 70) {
        toast('Good quality - consider recommendations', { icon: '⚠️' });
      } else {
        toast.error('Quality concerns detected - review recommendations');
      }
    } catch (error) {
      console.error('Quality analysis error:', error);
      toast.error('Failed to analyze design quality');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSuccessColor = (probability: number) => {
    if (probability >= 85) return 'text-green-600 dark:text-green-400';
    if (probability >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getSuccessBarColor = (probability: number) => {
    if (probability >= 85) return 'bg-green-500';
    if (probability >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Quality Predictor
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sign in to get AI-powered quality predictions and fabrication recommendations.
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Target className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Quality Predictor
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered fabrication analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={autoAnalyze}
                onChange={(e) => setAutoAnalyze(e.target.checked)}
                className="rounded"
              />
              <span>Auto-analyze</span>
            </label>
            <button
              onClick={analyzePrediction}
              disabled={isAnalyzing || !svgData}
              className="btn-primary flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Quality'}</span>
            </button>
          </div>
        </div>

        {isAnalyzing && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100"></div>
              <span className="text-gray-600 dark:text-gray-400">Analyzing design quality...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quality Prediction Results */}
      {prediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
        >
          {/* Success Probability */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Fabrication Success Probability
              </h4>
              <span className={`text-2xl font-bold ${getSuccessColor(prediction.successProbability)}`}>
                {prediction.successProbability}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${getSuccessBarColor(prediction.successProbability)}`}
                style={{ width: `${prediction.successProbability}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {prediction.successProbability >= 85 && 'Excellent - High probability of successful fabrication'}
              {prediction.successProbability >= 70 && prediction.successProbability < 85 && 'Good - Minor adjustments may improve results'}
              {prediction.successProbability < 70 && 'Caution - Review recommendations before fabricating'}
            </p>
          </div>

          {/* Analysis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recommendations */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recommendations
                </h5>
              </div>
              <div className="space-y-2">
                {prediction.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2 text-xs">
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Material Optimizations */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Material Optimizations
                </h5>
              </div>
              <div className="space-y-2">
                {prediction.materialOptimizations.map((opt, index) => (
                  <div key={index} className="flex items-start space-x-2 text-xs">
                    <TrendingUp className="w-3 h-3 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400">{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Potential Issues */}
          {prediction.potentialIssues.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Potential Issues
                </h5>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prediction.potentialIssues.map((issue, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-orange-700 dark:text-orange-300">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Always test settings on scrap material first
              </span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>Analysis updated</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
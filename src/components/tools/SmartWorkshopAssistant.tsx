import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Brain, 
  Zap, 
  Shield, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Target
} from 'lucide-react';
import { useUser } from '../../store/authStore';
import type { UserProject } from '../../lib/database';
import type { WorkshopGuidance, QualityPrediction } from '../../lib/cloudflare-ai';

interface SmartWorkshopAssistantProps {
  project: UserProject;
  onProjectUpdate?: (project: UserProject) => void;
}

export default function SmartWorkshopAssistant({ project, onProjectUpdate }: SmartWorkshopAssistantProps) {
  const user = useUser();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [guidance, setGuidance] = useState<WorkshopGuidance | null>(null);
  const [qualityPrediction, setQualityPrediction] = useState<QualityPrediction | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Initialize analysis when component mounts
  useEffect(() => {
    if (project && user) {
      analyzeProject();
    }
  }, [project, user]);

  const analyzeProject = async () => {
    if (!user) {
      toast.error('Please sign in to use AI analysis');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Get workshop guidance
      const guidanceResponse = await fetch('/api/ai/workshop-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ project })
      });

      if (!guidanceResponse.ok) throw new Error('Failed to get workshop guidance');
      const guidanceData = await guidanceResponse.json();
      setGuidance(guidanceData);

      // Get quality prediction
      if (project.svg_data) {
        const qualityResponse = await fetch('/api/ai/analyze-quality', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            svgData: project.svg_data,
            material: 'wood', // Default material
            settings: {}
          })
        });

        if (qualityResponse.ok) {
          const qualityData = await qualityResponse.json();
          setQualityPrediction(qualityData);
        }
      }

      toast.success('AI analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze project');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startGuidance = () => {
    setIsActive(true);
    setCurrentStep(0);
    toast.success('Workshop guidance started!');
  };

  const nextStep = () => {
    if (guidance && currentStep < guidance.stepByStep.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsActive(false);
      toast.success('Project completed! Great work!');
    }
  };

  const resetGuidance = () => {
    setCurrentStep(0);
    setIsActive(false);
  };

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Smart Workshop Assistant
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sign in to get AI-powered guidance, safety tips, and quality predictions for your projects.
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Brain className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Smart Workshop Assistant
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered guidance for {project.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isActive ? (
              <button
                onClick={startGuidance}
                disabled={!guidance || isAnalyzing}
                className="btn-primary flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start Guidance</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsActive(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <Pause className="w-4 h-4" />
                </button>
                <button
                  onClick={resetGuidance}
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {isAnalyzing && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100"></div>
              <span className="text-gray-600 dark:text-gray-400">Analyzing project with AI...</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Quality Prediction */}
      {qualityPrediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Target className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Quality Prediction
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Success Probability */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Success Probability
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {qualityPrediction.successProbability}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gray-900 dark:bg-gray-100 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${qualityPrediction.successProbability}%` }}
                ></div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recommendations
              </h5>
              <div className="space-y-1">
                {qualityPrediction.recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-3 h-3 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Issues */}
          {qualityPrediction.potentialIssues.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Potential Issues
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {qualityPrediction.potentialIssues.map((issue, index) => (
                  <div key={index} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
                    {issue}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Step-by-Step Guidance */}
      {guidance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Workshop Guidance
              </h4>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{guidance.timeEstimate}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4" />
                <span>Difficulty: {guidance.difficultyRating}/10</span>
              </div>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Safety First
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {guidance.safetyTips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-2 text-xs text-gray-600 dark:text-gray-400 bg-red-50 dark:bg-red-900/20 rounded px-3 py-2">
                  <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Progress */}
          {isActive && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress: Step {currentStep + 1} of {guidance.stepByStep.length}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {Math.round(((currentStep + 1) / guidance.stepByStep.length) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-gray-900 dark:bg-gray-100 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / guidance.stepByStep.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Current Step */}
          <AnimatePresence mode="wait">
            {isActive && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full flex items-center justify-center text-xs font-bold">
                    {currentStep + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {guidance.stepByStep[currentStep]}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Take your time and follow safety protocols
                      </div>
                      <button
                        onClick={nextStep}
                        className="btn-primary text-xs px-3 py-1"
                      >
                        {currentStep < guidance.stepByStep.length - 1 ? 'Next Step' : 'Complete'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tools Needed */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Required Tools
            </h5>
            <div className="flex flex-wrap gap-2">
              {guidance.toolsNeeded.map((tool, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
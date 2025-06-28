import React, { useState, useEffect } from 'react';
import { isOpenAIConfigured, openaiService, mockAIService } from '../../lib/openai';
import { useAuthStore } from '../../store/authStore';

interface AIServiceSelectorProps {
  onServiceChange?: (service: 'openai' | 'mock') => void;
}

export default function AIServiceSelector({ onServiceChange }: AIServiceSelectorProps) {
  const [selectedService, setSelectedService] = useState<'openai' | 'mock'>('mock');
  const [isConfigured, setIsConfigured] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const configured = isOpenAIConfigured();
    setIsConfigured(configured);
    setSelectedService(configured ? 'openai' : 'mock');
  }, []);

  const handleServiceChange = (service: 'openai' | 'mock') => {
    setSelectedService(service);
    onServiceChange?.(service);
  };

  if (!user) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            AI Service Configuration
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="aiService"
                  value="openai"
                  checked={selectedService === 'openai'}
                  onChange={() => handleServiceChange('openai')}
                  disabled={!isConfigured}
                  className="mr-2"
                />
                <span className={`text-sm ${!isConfigured ? 'text-gray-400' : 'text-blue-700 dark:text-blue-300'}`}>
                  OpenAI GPT-4 {!isConfigured && '(Not configured)'}
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="aiService"
                  value="mock"
                  checked={selectedService === 'mock'}
                  onChange={() => handleServiceChange('mock')}
                  className="mr-2"
                />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Demo Mode (Mock data)
                </span>
              </label>
            </div>
            
            {!isConfigured && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Add your OpenAI API key to environment variables to enable real AI generation.
                Currently using demo mode with mock responses.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
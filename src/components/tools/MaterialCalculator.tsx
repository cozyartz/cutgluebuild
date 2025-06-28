import React, { useState, useEffect } from 'react';

interface MaterialCalculatorProps {
  svgData?: string;
  onCalculationComplete?: (calculation: MaterialCalculation) => void;
}

interface MaterialCalculation {
  area: number;
  perimeter: number;
  estimatedCutTime: number;
  materialCost: number;
  recommendations: string[];
}

interface MaterialType {
  id: string;
  name: string;
  costPerSqIn: number;
  cutSpeed: number; // inches per minute
  thickness: string;
  description: string;
}

const materialTypes: MaterialType[] = [
  {
    id: 'plywood-3mm',
    name: '3mm Plywood',
    costPerSqIn: 0.05,
    cutSpeed: 15,
    thickness: '3mm',
    description: 'General purpose laser cutting'
  },
  {
    id: 'acrylic-3mm',
    name: '3mm Acrylic',
    costPerSqIn: 0.12,
    cutSpeed: 8,
    thickness: '3mm',
    description: 'Clear or colored acrylic'
  },
  {
    id: 'mdf-6mm',
    name: '6mm MDF',
    costPerSqIn: 0.03,
    cutSpeed: 12,
    thickness: '6mm',
    description: 'Medium density fiberboard'
  },
  {
    id: 'cardboard-2mm',
    name: '2mm Cardboard',
    costPerSqIn: 0.01,
    cutSpeed: 25,
    thickness: '2mm',
    description: 'Prototyping and templates'
  },
  {
    id: 'leather-2mm',
    name: '2mm Leather',
    costPerSqIn: 0.25,
    cutSpeed: 10,
    thickness: '2mm',
    description: 'Vegetable tanned leather'
  }
];

export default function MaterialCalculator({ svgData, onCalculationComplete }: MaterialCalculatorProps) {
  const [selectedMaterial, setSelectedMaterial] = useState('plywood-3mm');
  const [dimensions, setDimensions] = useState({ width: 100, height: 100 });
  const [calculation, setCalculation] = useState<MaterialCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (svgData) {
      extractDimensionsFromSVG(svgData);
    }
  }, [svgData]);

  const extractDimensionsFromSVG = (svg: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');
      
      if (svgElement) {
        const width = parseFloat(svgElement.getAttribute('width') || '100');
        const height = parseFloat(svgElement.getAttribute('height') || '100');
        setDimensions({ width, height });
      }
    } catch (error) {
      console.error('Error parsing SVG:', error);
    }
  };

  const calculateMaterial = async () => {
    setIsCalculating(true);
    
    try {
      // Simulate calculation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const material = materialTypes.find(m => m.id === selectedMaterial)!;
      const area = (dimensions.width * dimensions.height) / 645.16; // Convert mm² to in²
      const perimeter = estimatePerimeter();
      const cutTime = perimeter / material.cutSpeed; // minutes
      const materialCost = area * material.costPerSqIn;
      
      const recommendations = generateRecommendations(material, area, cutTime);
      
      const result: MaterialCalculation = {
        area,
        perimeter,
        estimatedCutTime: cutTime,
        materialCost,
        recommendations
      };
      
      setCalculation(result);
      onCalculationComplete?.(result);
      
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const estimatePerimeter = (): number => {
    // Simplified perimeter estimation
    // In a real implementation, this would parse the SVG paths
    return (dimensions.width + dimensions.height) * 2 / 25.4; // Convert mm to inches
  };

  const generateRecommendations = (material: MaterialType, area: number, cutTime: number): string[] => {
    const recommendations: string[] = [];
    
    if (cutTime > 30) {
      recommendations.push('Consider simplifying the design to reduce cut time');
    }
    
    if (area > 50) {
      recommendations.push('Large design - ensure your material sheet is big enough');
    }
    
    if (material.id === 'acrylic-3mm') {
      recommendations.push('Remove protective film after cutting for best results');
    }
    
    if (material.id === 'plywood-3mm') {
      recommendations.push('Sand edges lightly after cutting for smooth finish');
    }
    
    recommendations.push(`Recommended laser speed: ${material.cutSpeed} in/min`);
    
    return recommendations;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)}s`;
    } else if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Material Calculator
      </h3>
      
      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Width (mm)
          </label>
          <input
            type="number"
            value={dimensions.width}
            onChange={(e) => setDimensions(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Height (mm)
          </label>
          <input
            type="number"
            value={dimensions.height}
            onChange={(e) => setDimensions(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Material Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Material Type
        </label>
        <select
          value={selectedMaterial}
          onChange={(e) => setSelectedMaterial(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          {materialTypes.map((material) => (
            <option key={material.id} value={material.id}>
              {material.name} - {formatCurrency(material.costPerSqIn)}/sq in
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {materialTypes.find(m => m.id === selectedMaterial)?.description}
        </p>
      </div>

      {/* Calculate Button */}
      <button
        onClick={calculateMaterial}
        disabled={isCalculating}
        className="w-full btn btn-primary py-3 text-base font-medium mb-6"
      >
        {isCalculating ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Calculating...
          </>
        ) : (
          'Calculate Material Needs'
        )}
      </button>

      {/* Results */}
      {calculation && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">Material Area</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {calculation.area.toFixed(2)} sq in
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">Cut Time</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatTime(calculation.estimatedCutTime)}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">Material Cost</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(calculation.materialCost)}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">Cut Length</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {calculation.perimeter.toFixed(1)} in
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {calculation.recommendations.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Recommendations
              </h4>
              <ul className="space-y-1">
                {calculation.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
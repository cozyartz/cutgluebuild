import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

interface UploadVectorizerProps {
  onVectorize?: (svgData: string, originalImage: string) => void;
}

interface VectorizationSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  colorMode: 'monochrome' | 'grayscale' | 'color';
  smoothing: number;
  threshold: number;
}

export default function UploadVectorizer({ onVectorize }: UploadVectorizerProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [vectorizedSvg, setVectorizedSvg] = useState<string | null>(null);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [settings, setSettings] = useState<VectorizationSettings>({
    quality: 'medium',
    colorMode: 'monochrome',
    smoothing: 50,
    threshold: 128
  });
  const [splitView, setSplitView] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setVectorizedSvg(null);
        setSplitView(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: false
  });

  const vectorizeImage = async () => {
    if (!uploadedImage) return;

    setIsVectorizing(true);
    try {
      // Simulate vectorization process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create mock SVG based on settings
      const svgData = createMockVectorizedSVG(settings);
      setVectorizedSvg(svgData);
      setSplitView(true);
      
      if (onVectorize) {
        onVectorize(svgData, uploadedImage);
      }
      
      toast.success('Image vectorized successfully!');
      
    } catch (error) {
      console.error('Vectorization error:', error);
      toast.error('Failed to vectorize image. Please try again.');
    } finally {
      setIsVectorizing(false);
    }
  };

  const createMockVectorizedSVG = (settings: VectorizationSettings): string => {
    const width = 300;
    const height = 300;
    
    let content = '';
    
    if (settings.colorMode === 'monochrome') {
      // Simple black and white paths
      content = `
        <path d="M50,50 Q150,20 250,50 Q220,150 250,250 Q150,280 50,250 Q20,150 50,50 Z" 
              fill="none" stroke="#000" stroke-width="2"/>
        <circle cx="150" cy="150" r="30" fill="none" stroke="#000" stroke-width="2"/>
        <path d="M100,100 L200,100 L200,200 L100,200 Z" 
              fill="none" stroke="#000" stroke-width="1"/>
      `;
    } else if (settings.colorMode === 'grayscale') {
      // Multiple gray levels for engraving
      content = `
        <rect x="50" y="50" width="200" height="200" fill="#f0f0f0" stroke="#000" stroke-width="1"/>
        <circle cx="150" cy="150" r="60" fill="#d0d0d0" stroke="#666" stroke-width="1"/>
        <circle cx="150" cy="150" r="30" fill="#a0a0a0" stroke="#333" stroke-width="1"/>
        <circle cx="150" cy="150" r="15" fill="#606060" stroke="#000" stroke-width="1"/>
      `;
    } else {
      // Full color paths
      content = `
        <path d="M50,50 Q150,20 250,50 Q220,150 250,250 Q150,280 50,250 Q20,150 50,50 Z" 
              fill="#ff6b6b" stroke="#e55555" stroke-width="2"/>
        <circle cx="150" cy="150" r="40" fill="#4ecdc4" stroke="#45b7aa" stroke-width="2"/>
        <rect x="120" y="120" width="60" height="60" fill="#ffe66d" stroke="#ffdd44" stroke-width="1"/>
      `;
    }

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .cut-line { stroke: #ff0000; stroke-width: 0.1; }
            .engrave-area { fill: #0000ff; opacity: 0.1; }
          </style>
        </defs>
        ${content}
        <text x="10" y="290" font-family="Arial" font-size="10" fill="#666" opacity="0.7">
          Vectorized - ${settings.quality} quality
        </text>
      </svg>
    `;
  };

  const downloadSVG = () => {
    if (!vectorizedSvg) return;
    
    const blob = new Blob([vectorizedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vectorized-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upload & Settings */}
        <div className="space-y-6">
          {/* Upload Area */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Upload & Vectorize
            </h2>
            
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
              }`}
            >
              <input {...getInputProps()} />
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {isDragActive ? 'Drop the image here' : 'Drop images here or click to upload'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>

          {/* Settings */}
          {uploadedImage && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Vectorization Settings
              </h3>
              
              {/* Quality */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trace Quality
                </label>
                <select
                  value={settings.quality}
                  onChange={(e) => setSettings(prev => ({ ...prev, quality: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">Low (Fast)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Detailed)</option>
                  <option value="ultra">Ultra (Slow)</option>
                </select>
              </div>

              {/* Color Mode */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color Mode
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'monochrome', label: 'Monochrome (Cut only)' },
                    { value: 'grayscale', label: 'Grayscale (Engrave)' },
                    { value: 'color', label: 'Full Color' }
                  ].map(mode => (
                    <label key={mode.value} className="flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="colorMode"
                        value={mode.value}
                        checked={settings.colorMode === mode.value}
                        onChange={(e) => setSettings(prev => ({ ...prev, colorMode: e.target.value as any }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{mode.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Smoothing */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Smoothing: {settings.smoothing}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.smoothing}
                  onChange={(e) => setSettings(prev => ({ ...prev, smoothing: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                  <span>Sharp</span>
                  <span>Smooth</span>
                </div>
              </div>

              {/* Threshold */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Threshold: {settings.threshold}
                </label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={settings.threshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, threshold: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                  <span>Light</span>
                  <span>Dark</span>
                </div>
              </div>

              <button
                onClick={vectorizeImage}
                disabled={isVectorizing}
                className="w-full btn btn-primary py-3 text-base font-medium"
              >
                {isVectorizing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Vectorizing...
                  </>
                ) : (
                  'Vectorize Image'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Preview</h3>
              <div className="flex items-center space-x-3">
                {vectorizedSvg && (
                  <>
                    <button
                      onClick={() => setSplitView(!splitView)}
                      className="btn btn-outline text-sm"
                    >
                      {splitView ? 'Single View' : 'Split View'}
                    </button>
                    <button
                      onClick={downloadSVG}
                      className="btn btn-primary text-sm"
                    >
                      Download SVG
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 min-h-96">
              {uploadedImage ? (
                <div className={`grid ${splitView && vectorizedSvg ? 'grid-cols-2 gap-6' : 'grid-cols-1'} h-full`}>
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Original</h4>
                    <img
                      src={uploadedImage}
                      alt="Original"
                      className="max-w-full max-h-80 mx-auto rounded-lg shadow-md"
                    />
                  </div>
                  
                  {splitView && vectorizedSvg && (
                    <div className="text-center">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Vectorized</h4>
                      <div
                        className="max-w-full max-h-80 mx-auto"
                        dangerouslySetInnerHTML={{ __html: vectorizedSvg }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-gray-400 dark:text-gray-600">
                  <div>
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium">No image uploaded</p>
                    <p className="text-sm">Upload an image to see the preview and vectorization</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
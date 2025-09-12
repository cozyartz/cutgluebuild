import React, { useEffect, useRef, useState } from 'react';
import {
  Canvas,
  Rect,
  Circle,
  Textbox,
  loadSVGFromString,
  util as fabricUtil,
  FabricObject,
} from 'fabric';
import toast from 'react-hot-toast';
import ShaperSVGExporter from './ShaperSVGExporter';

interface DesignEditorProps {
  projectId?: string;
  initialSvgData?: string;
  canvasSettings?: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  onSave?: (svgData: string) => void;
}

export default function DesignEditor({
  projectId,
  initialSvgData,
  canvasSettings = { width: 800, height: 600, backgroundColor: '#ffffff' },
  onSave,
}: DesignEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState('select');
  const [showShaperExport, setShowShaperExport] = useState(false);
  const [currentSvgData, setCurrentSvgData] = useState<string>('');

  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new Canvas(canvasRef.current, {
        width: canvasSettings.width,
        height: canvasSettings.height,
        backgroundColor: canvasSettings.backgroundColor,
      });

      setCanvas(fabricCanvas);

      if (initialSvgData) {
        loadSvgData(fabricCanvas, initialSvgData);
      }

      return () => {
        fabricCanvas.dispose();
      };
    }
  }, []);

  const loadSvgData = (fabricCanvas: Canvas, svgData: string) => {
    loadSVGFromString(svgData, (objects, options) => {
      if (Array.isArray(objects)) {
        const obj = fabricUtil.groupSVGElements(objects as FabricObject[], options);
        fabricCanvas.add(obj);
        fabricCanvas.centerObject(obj);
      } else {
        // Handle single object case
        fabricCanvas.add(objects as unknown as FabricObject);
        fabricCanvas.centerObject(objects as unknown as FabricObject);
      }
      fabricCanvas.renderAll();
    });
  };

  const addShape = (shape: 'rect' | 'circle' | 'text') => {
    if (!canvas) return;

    let obj: FabricObject;
    if (shape === 'rect') {
      obj = new Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2,
      });
    } else if (shape === 'circle') {
      obj = new Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2,
      });
    } else {
      obj = new Textbox('Sample Text', {
        left: 100,
        top: 100,
        fontFamily: 'Arial',
        fontSize: 20,
        fill: '#000000',
        width: 200,
      });
    }

    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
  };

  const deleteSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  };

  const saveDesign = async () => {
    if (!canvas) return;

    setIsLoading(true);
    try {
      const svgData = canvas.toSVG();
      if (onSave) onSave(svgData);

      if (projectId && projectId !== 'temp') {
        const response = await fetch('/api/projects/save-revision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            svgData,
            changesDescription: 'Design updated',
            metadata: {
              canvasSettings: {
                width: canvas.width,
                height: canvas.height,
                backgroundColor: canvas.backgroundColor,
              },
            },
          }),
        });
        if (!response.ok) throw new Error('Failed to save project');
      }

      toast.success('Design saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save design');
    } finally {
      setIsLoading(false);
    }
  };

  const exportSvg = () => {
    if (!canvas) return;

    const svgData = canvas.toSVG();
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportForShaper = () => {
    if (!canvas) return;

    const svgData = canvas.toSVG();
    setCurrentSvgData(svgData);
    setShowShaperExport(true);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedTool('select')}
              className={`p-2 rounded ${selectedTool === 'select' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Select"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
              </svg>
            </button>
            <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
            <button onClick={() => addShape('rect')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Add Rectangle">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              </svg>
            </button>
            <button onClick={() => addShape('circle')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Add Circle">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </button>
            <button onClick={() => addShape('text')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Add Text">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>
            <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
            <button onClick={deleteSelected} className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400" title="Delete Selected">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={saveDesign} disabled={isLoading} className="btn btn-primary text-sm">
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={exportSvg} className="btn btn-outline text-sm">
              Export SVG
            </button>
            <button 
              onClick={exportForShaper} 
              className="btn bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center space-x-2"
              title="Export for Shaper Origin"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span>Export for Shaper</span>
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        {showShaperExport ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <button
                onClick={() => setShowShaperExport(false)}
                className="btn btn-outline text-sm flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Editor</span>
              </button>
            </div>
            <ShaperSVGExporter
              svgData={currentSvgData}
              projectTitle={`Project ${projectId || 'Design'}`}
              onShaperSVGGenerated={(svg) => {
                console.log('Shaper SVG generated:', svg);
                toast.success('Shaper SVG ready for download!');
              }}
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <canvas ref={canvasRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

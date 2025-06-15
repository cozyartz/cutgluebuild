import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeEstimate: string;
  materials: string[];
  tools: string[];
  steps: string[];
  category: string;
  image: string;
}

interface ProjectGeneratorProps {
  onProjectSelect?: (project: ProjectIdea) => void;
}

export default function ProjectGenerator({ onProjectSelect }: ProjectGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [filters, setFilters] = useState({
    skill: 'beginner',
    materials: [] as string[],
    tools: [] as string[],
    category: 'any',
    timeAvailable: '1-2'
  });

  const mockProjects: ProjectIdea[] = [
    {
      id: '1',
      title: 'Geometric Wall Art',
      description: 'Create stunning geometric patterns for your wall. Perfect for beginners with clean, simple cuts.',
      difficulty: 'beginner',
      timeEstimate: '2-3 hours',
      materials: ['Wood', 'Acrylic'],
      tools: ['Laser Cutter'],
      steps: [
        'Choose geometric pattern',
        'Prepare material (3mm plywood recommended)',
        'Set laser parameters for cutting',
        'Cut the design',
        'Sand edges smooth',
        'Apply finish if desired',
        'Mount on wall'
      ],
      category: 'home-decor',
      image: '🎨'
    },
    {
      id: '2',
      title: 'Custom Coaster Set',
      description: 'Personalized coasters with your own designs. Great for gifts or home use.',
      difficulty: 'beginner',
      timeEstimate: '1-2 hours',
      materials: ['Wood', 'Leather'],
      tools: ['Laser Cutter', 'Cricut Machine'],
      steps: [
        'Design coaster pattern',
        'Select material (cork or wood)',
        'Cut coasters to size',
        'Engrave design',
        'Apply protective coating',
        'Add felt backing'
      ],
      category: 'gifts',
      image: '☕'
    },
    {
      id: '3',
      title: 'Desk Organizer',
      description: 'Multi-compartment organizer for your workspace. Customizable sizes and layouts.',
      difficulty: 'intermediate',
      timeEstimate: '3-4 hours',
      materials: ['Wood', 'Acrylic'],
      tools: ['Laser Cutter'],
      steps: [
        'Measure desk space',
        'Design compartment layout',
        'Create cutting template',
        'Cut all pieces',
        'Test fit assembly',
        'Glue joints',
        'Sand and finish'
      ],
      category: 'functional',
      image: '📝'
    }
  ];

  const generateProjects = async () => {
    setIsGenerating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Filter projects based on criteria
      const filteredProjects = mockProjects.filter(project => {
        if (filters.skill !== 'any' && project.difficulty !== filters.skill) {
          return false;
        }
        
        if (filters.category !== 'any' && project.category !== filters.category) {
          return false;
        }
        
        if (filters.materials.length > 0) {
          const hasMatchingMaterial = filters.materials.some(material => 
            project.materials.some(projectMaterial => 
              projectMaterial.toLowerCase().includes(material.toLowerCase())
            )
          );
          if (!hasMatchingMaterial) return false;
        }
        
        if (filters.tools.length > 0) {
          const hasMatchingTool = filters.tools.some(tool => 
            project.tools.some(projectTool => 
              projectTool.toLowerCase().includes(tool.toLowerCase())
            )
          );
          if (!hasMatchingTool) return false;
        }
        
        return true;
      });

      setProjects(filteredProjects);
      
      if (filteredProjects.length === 0) {
        toast.error('No projects found matching your criteria. Try adjusting your filters.');
      } else {
        toast.success(`Found ${filteredProjects.length} project ideas!`);
      }
      
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate project ideas. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMaterialChange = (material: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      materials: checked 
        ? [...prev.materials, material]
        : prev.materials.filter(m => m !== material)
    }));
  };

  const handleToolChange = (tool: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      tools: checked 
        ? [...prev.tools, tool]
        : prev.tools.filter(t => t !== tool)
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Project Preferences
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Skill Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Skill Level
            </label>
            <select
              value={filters.skill}
              onChange={(e) => setFilters(prev => ({ ...prev, skill: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Project Type
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="any">Any Project</option>
              <option value="home-decor">Home Decor</option>
              <option value="gifts">Gifts</option>
              <option value="functional">Functional Items</option>
              <option value="art">Art Projects</option>
            </select>
          </div>

          {/* Time Available */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Time Available
            </label>
            <select
              value={filters.timeAvailable}
              onChange={(e) => setFilters(prev => ({ ...prev, timeAvailable: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="1-2">1-2 hours</option>
              <option value="3-5">3-5 hours</option>
              <option value="6-10">6-10 hours</option>
              <option value="10+">10+ hours</option>
            </select>
          </div>
        </div>

        {/* Materials */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Available Materials
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {['Wood', 'Acrylic', 'Cardboard', 'Leather', 'Fabric', 'Metal'].map(material => (
              <label key={material} className="flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={filters.materials.includes(material)}
                  onChange={(e) => handleMaterialChange(material, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{material}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Available Tools
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Laser Cutter', 'Cricut Machine', 'CNC Router', 'Hand Tools'].map(tool => (
              <label key={tool} className="flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={filters.tools.includes(tool)}
                  onChange={(e) => handleToolChange(tool, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{tool}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={generateProjects}
            disabled={isGenerating}
            className="btn btn-primary w-full md:w-auto"
          >
            {isGenerating ? 'Generating Ideas...' : 'Get Project Ideas'}
          </button>
        </div>
      </div>

      {/* Results */}
      {projects.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Project Ideas ({projects.length})
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map(project => (
              <div key={project.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">{project.image}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {project.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                          {project.difficulty}
                        </span>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                          {project.timeEstimate}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {project.description}
                    </p>
                    
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Materials:</h5>
                      <div className="flex flex-wrap gap-2">
                        {project.materials.map(material => (
                          <span key={material} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Steps:</h5>
                      <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {project.steps.slice(0, 3).map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                        {project.steps.length > 3 && (
                          <li className="text-gray-500">... and {project.steps.length - 3} more steps</li>
                        )}
                      </ol>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => onProjectSelect?.(project)}
                        className="btn btn-primary text-sm"
                      >
                        Start Project
                      </button>
                      <button className="btn btn-outline text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
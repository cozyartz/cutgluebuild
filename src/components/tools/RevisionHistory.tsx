import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Revision {
  id: string;
  revision_number: number;
  changes_description: string;
  created_at: string;
  metadata?: any;
}

interface RevisionHistoryProps {
  projectId: string;
  currentRevisionId?: string;
  onRevisionRestore: (revisionId: string) => void;
}

export default function RevisionHistory({ 
  projectId, 
  currentRevisionId, 
  onRevisionRestore 
}: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  useEffect(() => {
    loadRevisions();
  }, [projectId]);

  const loadRevisions = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('project_revisions')
        .select('*')
        .eq('project_id', projectId)
        .order('revision_number', { ascending: false });

      if (error) {
        throw error;
      }

      setRevisions(data || []);
    } catch (error) {
      console.error('Error loading revisions:', error);
      toast.error('Failed to load revision history');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreRevision = async (revisionId: string) => {
    try {
      setIsRestoring(revisionId);

      const response = await fetch('/api/projects/restore-revision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          revisionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to restore revision');
      }

      const result = await response.json();
      
      toast.success('Revision restored successfully!');
      onRevisionRestore(revisionId);
      
      // Reload revisions to get the new current state
      await loadRevisions();
      
    } catch (error) {
      console.error('Error restoring revision:', error);
      toast.error('Failed to restore revision');
    } finally {
      setIsRestoring(null);
    }
  };

  const previewRevision = async (revisionId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_revisions')
        .select('svg_data')
        .eq('id', revisionId)
        .single();

      if (error) {
        throw error;
      }

      // Open preview in new window
      const previewWindow = window.open('', '_blank', 'width=800,height=600');
      if (previewWindow) {
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Revision Preview</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh; 
                  background: #f5f5f5; 
                }
                svg { 
                  max-width: 100%; 
                  max-height: 100%; 
                  border: 1px solid #ddd; 
                  background: white; 
                }
              </style>
            </head>
            <body>
              ${data.svg_data}
            </body>
          </html>
        `);
        previewWindow.document.close();
      }
    } catch (error) {
      console.error('Error previewing revision:', error);
      toast.error('Failed to preview revision');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Revision History
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {revisions.length} revision{revisions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {revisions.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">No revisions yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {revisions.map((revision, index) => (
              <div
                key={revision.id}
                className={`p-4 border-l-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  revision.id === currentRevisionId
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Revision #{revision.revision_number}
                      </span>
                      {revision.id === currentRevisionId && (
                        <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded text-xs font-medium">
                          Current
                        </span>
                      )}
                      {index === 0 && revision.id !== currentRevisionId && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                          Latest
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {revision.changes_description}
                    </p>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatDistanceToNow(new Date(revision.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => previewRevision(revision.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Preview"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>

                    {revision.id !== currentRevisionId && (
                      <button
                        onClick={() => restoreRevision(revision.id)}
                        disabled={isRestoring === revision.id}
                        className="p-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 disabled:opacity-50"
                        title="Restore this revision"
                      >
                        {isRestoring === revision.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
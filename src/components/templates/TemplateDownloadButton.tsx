import React, { useState } from 'react';
import { useAuthStore, useUser, useCanAccessFeature } from '../../store/authStore';
import toast from 'react-hot-toast';

interface TemplateDownloadButtonProps {
  templateId: string;
  templateTitle: string;
  isPremium: boolean;
  className?: string;
}

export default function TemplateDownloadButton({ 
  templateId, 
  templateTitle,
  isPremium, 
  className = '' 
}: TemplateDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const user = useUser();
  const canAccessPremium = useCanAccessFeature('premium_templates');

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Check if user is authenticated for premium templates
      if (isPremium) {
        if (!user) {
          toast.error('Please sign in to download premium templates');
          window.location.href = '/login';
          return;
        }

        // Check subscription tier
        if (!canAccessPremium) {
          toast.error('Premium templates require a paid subscription');
          window.location.href = '/pricing';
          return;
        }
      }

      // Get template data via API
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch template');
      }

      const template = await response.json();

      if (!template || !template.svg_data) {
        throw new Error('Template not found');
      }

      // Track download via API if user is authenticated
      if (user) {
        const trackResponse = await fetch('/api/templates/track-download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            templateId,
            userId: user.id
          })
        });

        if (!trackResponse.ok) {
          console.warn('Failed to track download, but continuing...');
        }
      }

      // Create and download file
      const blob = new Blob([template.svg_data], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Template downloaded successfully!');

    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download template. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={`btn ${isPremium ? 'btn-primary' : 'btn-outline'} ${className} ${
        isDownloading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isDownloading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Downloading...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          {isPremium ? 'Download' : 'Free Download'}
        </>
      )}
    </button>
  );
}
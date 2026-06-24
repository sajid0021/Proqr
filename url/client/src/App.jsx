import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import UrlForm from './components/UrlForm';
import LinksTable from './components/LinksTable';
import { api } from './services/api';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function App() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();

  // Fetch all links on mount
  useEffect(() => {
    const loadLinks = async () => {
      try {
        const data = await api.fetchUrls();
        setLinks(data);
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Connection Error',
          description: err.message || 'Failed to connect to backend',
        });
      } finally {
        setLoading(false);
      }
    };
    loadLinks();
  }, [toast]);

  // Handle URL creation
  const handleCreateUrl = async (originalUrl, customCode, successCallback) => {
    setFormLoading(true);
    try {
      const newLink = await api.createUrl(originalUrl, customCode);
      setLinks((prev) => [newLink, ...prev]);
      toast({
        description: 'URL shortened successfully! 🎉',
      });
      if (successCallback) successCallback();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Shortening Failed',
        description: err.message || 'Failed to shorten URL',
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle URL deletion
  const handleDeleteUrl = async (code) => {
    if (!window.confirm(`Are you sure you want to delete short URL /${code}?`)) {
      return;
    }
    
    try {
      await api.deleteUrl(code);
      setLinks((prev) => prev.filter((link) => link.code !== code));
      toast({
        description: 'Short link deleted successfully.',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: err.message || 'Failed to delete URL',
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-12">
      {/* Glow Points for Light Mode Aesthetics */}
      <div className="glow-spot bg-indigo-200/20 w-[450px] h-[450px] top-[-100px] left-[-100px]"></div>
      <div className="glow-spot bg-purple-200/20 w-[400px] h-[400px] bottom-[100px] right-[-100px]"></div>

      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 flex flex-col gap-6.5">
        {/* Dashboard Analytics Section */}
        <Dashboard links={links} />

        {/* Shortener Submission Form */}
        <UrlForm onSubmit={handleCreateUrl} loading={formLoading} />

        {/* Links Table & List */}
        {loading ? (
          <Card className="glass-effect flex justify-center py-14 shadow-sm border border-neutral-100">
            <span className="h-8 w-8 rounded-full border-3 border-neutral-200 border-t-indigo-600 animate-spin-fast"></span>
          </Card>
        ) : (
          <LinksTable
            links={links}
            onDelete={handleDeleteUrl}
            onCopy={(msg) => toast({ description: msg })}
          />
        )}
      </main>

      {/* Official shadcn Toaster */}
      <Toaster />
    </div>
  );
}

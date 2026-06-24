import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function UrlForm({ onSubmit, loading }) {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customCode, setCustomCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!originalUrl) return;
    
    onSubmit(originalUrl, customCode, () => {
      setOriginalUrl('');
      setCustomCode('');
    });
  };

  return (
    <Card className="glass-effect shadow-md">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Shorten a Long Link
        </CardTitle>
        <CardDescription className="text-neutral-500 text-sm">
          Paste your long URL below, optionally specify a custom alias, and click Shorten.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            {/* Destination URL Input */}
            <div className="flex-1 flex flex-col gap-1.5">
              <label htmlFor="url-input" className="text-xs font-semibold tracking-wide text-neutral-500">
                Destination URL
              </label>
              <Input
                id="url-input"
                type="text"
                placeholder="https://example.com/very/long/path/to/some/awesome/article"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                className="bg-white/50 border-neutral-200/80 rounded-lg shadow-sm placeholder:text-neutral-300 text-neutral-800 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                required
              />
            </div>

            {/* Custom Alias Input */}
            <div className="w-full md:w-1/3 flex flex-col gap-1.5">
              <label htmlFor="code-input" className="text-xs font-semibold tracking-wide text-neutral-500">
                Custom Alias <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <Input
                id="code-input"
                type="text"
                placeholder="e.g. promo-2026"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                className="bg-white/50 border-neutral-200/80 rounded-lg shadow-sm placeholder:text-neutral-300 text-neutral-800 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !originalUrl}
              className="w-full md:w-auto h-9 px-6 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow shadow-indigo-500/20"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin-fast"></span>
              ) : (
                <div className="flex items-center gap-1.5 justify-center">
                  <Sparkles className="h-4 w-4" />
                  <span>Shorten</span>
                </div>
              )}
            </Button>
          </div>

          {customCode && (
            <p className="text-xs text-neutral-400 font-mono bg-neutral-50/50 border border-neutral-100 p-2.5 rounded-lg">
              Your shortened URL preview: <span className="font-bold text-indigo-600">http://localhost:5000/{customCode}</span>
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

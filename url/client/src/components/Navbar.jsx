import React from 'react';
import { Link2, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/10">
            <Link2 className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            SnipLink
          </span>
        </a>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="h-9 w-9 rounded-lg border-neutral-200/80 bg-white/70 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
            >
              <Github className="h-4.5 w-4.5 text-neutral-600" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

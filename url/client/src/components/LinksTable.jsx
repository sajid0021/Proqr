import React, { useState } from 'react';
import { Search, Copy, Check, ExternalLink, Trash2, Calendar, Link as LinkIcon } from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LinksTable({ links = [], onDelete, onCopy }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  const handleCopy = (code) => {
    const shortUrl = `http://localhost:5000/${code}`;
    navigator.clipboard.writeText(shortUrl);
    setCopiedCode(code);
    onCopy('Short link copied to clipboard!');
    
    setTimeout(() => {
      setCopiedCode('');
    }, 2000);
  };

  const filteredLinks = links.filter((link) => {
    const search = searchTerm.toLowerCase();
    return (
      link.title.toLowerCase().includes(search) ||
      link.originalUrl.toLowerCase().includes(search) ||
      link.code.toLowerCase().includes(search)
    );
  });

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (_) {
      return 'N/A';
    }
  };

  return (
    <Card className="glass-effect shadow-md">
      <CardHeader className="p-6 pb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center sm:pb-4">
        <CardTitle className="text-lg font-bold text-neutral-800">Your Shortened Links</CardTitle>
        <div className="relative w-full sm:max-w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search links..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white/50 border-neutral-200/80 rounded-lg shadow-sm placeholder:text-neutral-300 text-neutral-800 text-sm focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 border border-dashed border-neutral-200 text-neutral-400 mb-3">
              <LinkIcon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-neutral-700 text-base">No Links Found</h3>
            <p className="text-neutral-400 text-sm max-w-sm mt-1">
              {searchTerm
                ? "We couldn't find any shortened URLs matching your search query."
                : "You haven't shortened any links yet. Submit a URL in the form above to get started!"}
            </p>
          </div>
        ) : (
          <div className="border-t border-neutral-100">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-neutral-50/50">
                  <TableHead className="font-bold text-neutral-500 pl-6 h-11">Link Details</TableHead>
                  <TableHead className="font-bold text-neutral-500 h-11">Short Link</TableHead>
                  <TableHead className="font-bold text-neutral-500 h-11">Clicks</TableHead>
                  <TableHead className="font-bold text-neutral-500 h-11">Date Created</TableHead>
                  <TableHead className="font-bold text-neutral-500 text-right pr-6 h-11">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.map((link) => {
                  const shortUrl = `http://localhost:5000/${link.code}`;
                  const isCopied = copiedCode === link.code;

                  return (
                    <TableRow key={link.code} className="hover:bg-neutral-50/30">
                      {/* Destination / Title */}
                      <TableCell className="pl-6">
                        <div className="flex flex-col max-w-[280px]">
                          <span className="font-bold text-neutral-700 truncate" title={link.title}>
                            {link.title || 'Untitled Link'}
                          </span>
                          <a
                            href={link.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-neutral-400 hover:text-indigo-600 underline-offset-2 hover:underline truncate mt-0.5"
                            title={link.originalUrl}
                          >
                            {link.originalUrl}
                          </a>
                        </div>
                      </TableCell>

                      {/* Short Link */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a
                            href={shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm font-semibold text-indigo-600 hover:underline"
                          >
                            localhost:5000/{link.code}
                          </a>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(link.code)}
                            className="h-7 w-7 rounded-md border-neutral-200/80 bg-white/70 hover:bg-neutral-100"
                            title="Copy short link"
                          >
                            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-neutral-500" />}
                          </Button>
                        </div>
                      </TableCell>

                      {/* Clicks */}
                      <TableCell>
                        <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                          <span>{link.clicks || 0}</span>
                          <span className="text-[10px] font-normal text-purple-500">clicks</span>
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <span className="text-xs text-neutral-500 flex items-center gap-1.5 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                          {formatDate(link.createdAt)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            asChild
                            className="h-8 w-8 rounded-lg border-neutral-200/80 bg-white/70 hover:bg-neutral-100 hover:text-neutral-900"
                            title="Visit destination URL"
                          >
                            <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 text-neutral-500" />
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onDelete(link.code)}
                            className="h-8 w-8 rounded-lg border-red-100 hover:border-red-200 bg-white/70 hover:bg-red-50 text-neutral-500 hover:text-red-600"
                            title="Delete short link"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

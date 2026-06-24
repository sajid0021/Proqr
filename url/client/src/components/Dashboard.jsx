import React, { useMemo } from 'react';
import { Link, MousePointerClick, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Dashboard({ links = [] }) {
  // Compute analytics
  const stats = useMemo(() => {
    const totalLinks = links.length;
    const totalClicks = links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
    
    let topLink = null;
    if (links.length > 0) {
      topLink = links.reduce((prev, current) => {
        return (prev.clicks || 0) > (current.clicks || 0) ? prev : current;
      });
      if (topLink && topLink.clicks === 0) {
        topLink = null;
      }
    }

    return {
      totalLinks,
      totalClicks,
      topLink
    };
  }, [links]);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {/* Total Links Card */}
      <Card className="glass-effect transition-all duration-300">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
            <Link className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Links</span>
            <span className="text-2xl font-bold tracking-tight text-neutral-800">{stats.totalLinks}</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Clicks Card */}
      <Card className="glass-effect transition-all duration-300">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
            <MousePointerClick className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Clicks</span>
            <span className="text-2xl font-bold tracking-tight text-neutral-800">{stats.totalClicks}</span>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Card */}
      <Card className="glass-effect transition-all duration-300">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Top Performer</span>
            <span 
              className="text-lg font-bold tracking-tight text-neutral-800 truncate"
              title={stats.topLink ? `${stats.topLink.title} (${stats.topLink.clicks} clicks)` : 'No performing links'}
            >
              {stats.topLink ? (
                <>/{stats.topLink.code} <span className="text-xs font-semibold text-emerald-600">({stats.topLink.clicks} ⚡)</span></>
              ) : (
                'None Yet'
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

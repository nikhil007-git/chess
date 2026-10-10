import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} Chess Arena Tournament System. Designed according to PRD v1.0 specifications.</p>
        <p className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Server Authoritative Clocks & Swiss / Knockout Engines</span>
        </p>
      </div>
    </footer>
  );
}

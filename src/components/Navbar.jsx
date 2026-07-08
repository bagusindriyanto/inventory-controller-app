import { LayersIcon } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="p-4 text-white border-b shadow-md bg-slate-900 border-slate-800">
      <div className="flex justify-between items-center mx-auto max-w-7xl">
        <div className="flex gap-3 items-center">
          <div className="p-2 rounded-lg bg-primary">
            <LayersIcon size={22} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              MGM Material Monitoring
            </h1>
            <p className="text-xs text-slate-400">
              Material Tracing & Allocation
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

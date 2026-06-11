import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export default function PageLoader({ message = '加载中...' }: PageLoaderProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-purple-500/20 rounded-full" />
        </div>
        <p className="text-slate-400 text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}

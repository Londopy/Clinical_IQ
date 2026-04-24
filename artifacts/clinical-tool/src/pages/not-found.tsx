import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
        <AlertCircle className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">404 — Page Not Found</h1>
        <p className="text-sm text-muted-foreground mt-1.5">This page doesn't exist.</p>
      </div>
      <Link href="/">
        <span className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </span>
      </Link>
    </div>
  );
}

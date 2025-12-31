"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const handleGoHome = () => {
    globalThis.location.href = "/";
  };

  const handleGoBack = () => {
    globalThis.history.back();
  };

  const handleSearch = () => {
    globalThis.location.href = "/search";
  };

  const handleSupport = () => {
    globalThis.location.href = "/support";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          {/* 404 Number */}
          <div className="space-y-2">
            <h1 className="text-8xl font-bold text-foreground tracking-tighter">
              404
            </h1>
            <div className="w-16 h-1 bg-foreground mx-auto rounded-full" />
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Page Not Found
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Sorry, we couldn't find the page you're looking for. It might have
              been moved, deleted, or you entered the wrong URL.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>

              <Button
                variant="outline"
                onClick={handleSearch}
                className="flex-1"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Need help? Contact our{" "}
              <button
                onClick={handleSupport}
                className="text-foreground hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
              >
                support team
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

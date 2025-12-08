"use client";

import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SentryExamplePage() {
  const triggerError = () => {
    throw new Error("Sentry Test Error - This is a test error to verify Sentry is working!");
  };

  const triggerSentryError = () => {
    Sentry.captureException(new Error("Manual Sentry Test - Captured via Sentry.captureException"));
    alert("Error sent to Sentry! Check your Sentry dashboard.");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Sentry Test Page</CardTitle>
          <CardDescription>
            Use these buttons to verify Sentry is properly configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={triggerError} 
            variant="destructive" 
            className="w-full"
          >
            Throw Unhandled Error
          </Button>
          <p className="text-xs text-muted-foreground">
            This will crash the page and trigger the global error boundary
          </p>
          
          <Button 
            onClick={triggerSentryError} 
            variant="outline" 
            className="w-full"
          >
            Send Manual Error to Sentry
          </Button>
          <p className="text-xs text-muted-foreground">
            This captures an error without crashing the page
          </p>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              After triggering an error, check your{" "}
              <a 
                href="https://coreys-apps.sentry.io/issues/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Sentry Issues dashboard
              </a>
              {" "}to verify it was captured.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


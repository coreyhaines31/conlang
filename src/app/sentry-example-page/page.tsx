"use client";

import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function SentryExamplePage() {
  const [dsnStatus, setDsnStatus] = useState<string>("checking...");
  
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (dsn) {
      setDsnStatus(`✅ Configured: ${dsn.substring(0, 30)}...`);
    } else {
      setDsnStatus("❌ NOT CONFIGURED - Add NEXT_PUBLIC_SENTRY_DSN to your environment");
    }
  }, []);

  const triggerError = () => {
    // Use a button that navigates to a page that throws
    throw new Error("Sentry Test Error - This is a test error to verify Sentry is working!");
  };

  const triggerSentryError = async () => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) {
      alert("ERROR: NEXT_PUBLIC_SENTRY_DSN is not set!\n\nAdd it to your .env.local file or Vercel environment variables.");
      return;
    }
    
    try {
      const eventId = Sentry.captureException(new Error("Manual Sentry Test - Captured via Sentry.captureException"));
      console.log("Sentry event ID:", eventId);
      alert(`Error sent to Sentry!\nEvent ID: ${eventId}\n\nCheck your Sentry dashboard.`);
    } catch (e) {
      console.error("Failed to send to Sentry:", e);
      alert("Failed to send error to Sentry. Check console for details.");
    }
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
        <CardContent className="border-b pb-4 mb-4">
          <div className="text-sm">
            <strong>DSN Status:</strong>{" "}
            <span className={dsnStatus.includes("NOT") ? "text-red-500" : "text-green-600"}>
              {dsnStatus}
            </span>
          </div>
        </CardContent>
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


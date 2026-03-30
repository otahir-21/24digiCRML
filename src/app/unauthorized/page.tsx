import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <ShieldAlert className="w-16 h-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            This page requires specific permissions that your account doesn&apos;t have. 
            Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/dashboard">
              <Button>
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">
                Login with Different Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
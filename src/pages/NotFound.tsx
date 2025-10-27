import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="text-center max-w-md w-full">
        <div className="glass-card p-8 sm:p-12">
          <div className="mb-6 flex justify-center">
            <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
              <AlertTriangle size={48} className="text-primary" />
            </div>
          </div>
          
          <h1 className="mb-4 text-6xl sm:text-7xl md:text-8xl font-bold font-orbitron neon-glow">404</h1>
          <h2 className="mb-4 text-xl sm:text-2xl font-semibold text-foreground">Page Not Found</h2>
          <p className="mb-8 text-sm sm:text-base text-muted-foreground px-4">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          
          <Link to="/">
            <Button variant="hero" size="lg" className="group w-full sm:w-auto">
              <Home size={18} className="mr-2" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

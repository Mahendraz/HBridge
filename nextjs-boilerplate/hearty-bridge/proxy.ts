import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from './lib/utils/jwt';

// Define protected routes and their access requirements
const routeConfig = {
  // Public routes (no authentication required)
  public: [
    '/',
    '/about',
    '/services',
    '/contact',
    '/help',
    '/privacy',
    '/terms',
    '/safety',
    '/guidelines',
    '/accessibility',
    '/auth/login',
    '/auth/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/health',
  ],
  
  // Routes requiring authentication (any role)
  authenticated: [
    '/dashboard',
    '/profile',
    '/api/auth/me',
    // Add other authenticated routes here
  ],
  
  // Therapist-only routes
  therapist: [
    '/therapist',
    '/therapist/dashboard',
    '/therapist/sessions',
    '/therapist/clients',
    '/api/therapist',
    // Add other therapist routes here
  ],
  
  // Parent-only routes
  parent: [
    '/parent',
    '/parent/dashboard',
    '/parent/children',
    '/parent/sessions',
    '/api/parent',
    // Add other parent routes here
  ],

  // API routes that need authentication
  api: {
    authenticated: [
      '/api/auth/me',
      '/api/profile',
      '/api/children',
      '/api/sessions',
    ],
    therapist: [
      '/api/therapist',
    ],
    parent: [
      '/api/parent',
    ]
  }
};

// Helper function to check if a path matches any pattern
function matchesPattern(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Exact match
    if (pattern === pathname) return true;
    
    // Wildcard pattern (ends with *)
    if (pattern.endsWith('*')) {
      return pathname.startsWith(pattern.slice(0, -1));
    }
    
    // Starts with pattern (for nested routes)
    if (pathname.startsWith(pattern + '/')) return true;
    
    return false;
  });
}

// Helper function to determine route type
function getRouteType(pathname: string): {
  type: 'public' | 'authenticated' | 'therapist' | 'parent';
  isApi: boolean;
} {
  const isApi = pathname.startsWith('/api');
  
  // Check public routes first
  if (matchesPattern(pathname, routeConfig.public)) {
    return { type: 'public', isApi };
  }
  
  // Check role-specific routes
  if (matchesPattern(pathname, routeConfig.therapist) || 
      matchesPattern(pathname, routeConfig.api.therapist)) {
    return { type: 'therapist', isApi };
  }
  
  if (matchesPattern(pathname, routeConfig.parent) || 
      matchesPattern(pathname, routeConfig.api.parent)) {
    return { type: 'parent', isApi };
  }
  
  // Check authenticated routes
  if (matchesPattern(pathname, routeConfig.authenticated) || 
      matchesPattern(pathname, routeConfig.api.authenticated)) {
    return { type: 'authenticated', isApi };
  }
  
  // Default to requiring authentication for unknown routes
  return { type: 'authenticated', isApi };
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip proxy for static files and Next.js internal routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/_vercel/')
  ) {
    return NextResponse.next();
  }

  const routeInfo = getRouteType(pathname);
  
  // Allow public routes
  if (routeInfo.type === 'public') {
    return NextResponse.next();
  }

  // Get user from token
  const user = getUserFromRequest(request);

  // Redirect unauthenticated users
  if (!user) {
    if (routeInfo.isApi) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    } else {
      // Redirect to login page, preserving the intended destination
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Check role-based access
  if (routeInfo.type === 'therapist' && user.role !== 'therapist') {
    if (routeInfo.isApi) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Insufficient permissions. Therapist access required.',
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      );
    } else {
      // Redirect to appropriate dashboard
      const dashboardUrl = user.role === 'parent' 
        ? new URL('/parent/dashboard', request.url)
        : new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  if (routeInfo.type === 'parent' && user.role !== 'parent') {
    if (routeInfo.isApi) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Insufficient permissions. Parent access required.',
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      );
    } else {
      // Redirect to appropriate dashboard
      const dashboardUrl = user.role === 'therapist' 
        ? new URL('/therapist/dashboard', request.url)
        : new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Handle authentication redirects for logged-in users accessing auth pages
  if ((pathname === '/auth/login' || pathname === '/auth/register') && user) {
    // Redirect to appropriate dashboard based on role
    const dashboardUrl = user.role === 'therapist'
      ? new URL('/therapist/dashboard', request.url)
      : user.role === 'parent'
      ? new URL('/parent/dashboard', request.url)
      : new URL('/dashboard', request.url);
    
    return NextResponse.redirect(dashboardUrl);
  }

  // Add security headers for all responses
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add CSP header for enhanced security
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

// Configure which paths the proxy should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
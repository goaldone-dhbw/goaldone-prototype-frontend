import { Role } from '../../api';
import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, of } from 'rxjs';
import { MOCK_USERS, MOCK_TASKS, MOCK_ORGANIZATIONS, MOCK_MEMBERS, MOCK_BREAKS, MOCK_SCHEDULE, MOCK_SUPERADMIN_INVITATIONS, MOCK_WORKING_HOURS } from './mock-data';
import { environment } from '../../../environments/environment';

export function mockInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  // Only intercept if the URL starts with our apiBasePath and we are in mock mode
  if (!req.url.startsWith(environment.apiBasePath)) {
    return next(req);
  }

  const { url, method, body } = req;
  console.log(`[MockInterceptor] ${method} ${url}`, body);

  // Helper to return success response
  const ok = (data?: unknown) => of(new HttpResponse({ status: 200, body: data })).pipe(delay(300));

  // Helper to return paginated response
  const page = (content: any[]) => ok({
    content: content,
    page: 0,
    size: 20,
    totalElements: content.length,
    totalPages: 1
  });

  // Helper to return 401
  const unauthorized = () => of(new HttpResponse({ status: 401, statusText: 'Unauthorized' })).pipe(delay(100));

  // --- Auth Endpoints ---

  if (url.endsWith('/auth/login') && method === 'POST') {
    const { email } = body as { email: string };
    console.log(`[MockInterceptor] Login attempt for email: ${email}`);
    const user = MOCK_USERS[email];
    if (user) {
      console.log(`[MockInterceptor] User found:`, user);
      return ok({
        accessToken: 'mock-access-token-' + user.id,
        user: user
      });
    }
    console.warn(`[MockInterceptor] User not found for email: ${email}`);
    return unauthorized();
  }

  if (url.endsWith('/auth/refresh') && method === 'POST') {
    return ok({ accessToken: 'mock-refreshed-token' });
  }

  if (url.endsWith('/auth/logout') && method === 'POST') {
    return ok({});
  }

  // --- User Endpoints ---

  if (url.endsWith('/users/me') && method === 'GET') {
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer mock-access-token-')) {
      const userId = authHeader.replace('Bearer mock-access-token-', '');
      const user = Object.values(MOCK_USERS).find(u => u.id === userId);
      if (user) {
        return ok(user);
      }
    }

    // Fallback if no token or unknown user
    return ok(MOCK_USERS['user@goaldone.de']);
  }

  // --- Working Hours Endpoints ---

  if (url.endsWith('/users/me/working-hours') && method === 'GET') {
    return ok(MOCK_WORKING_HOURS);
  }

  if (url.endsWith('/users/me/working-hours') && method === 'PUT') {
    return ok(body);
  }

  // --- Workspace & Tasks Endpoints ---

  if (url.endsWith('/tasks') && method === 'GET') {
    return page(MOCK_TASKS);
  }

  if (url.endsWith('/tasks') && method === 'POST') {
    return ok({ ...body as any, id: 't-' + Math.random(), createdAt: new Date().toISOString() });
  }

  // --- Organization Endpoints ---

  if (url.endsWith('/organizations') && method === 'GET') {
    return page(MOCK_ORGANIZATIONS);
  }

  if (url.includes('/members') && method === 'GET') {
    return page(MOCK_MEMBERS);
  }

  // --- Breaks & Schedule Endpoints ---

  if (url.endsWith('/breaks') && method === 'GET') {
    return page(MOCK_BREAKS);
  }

  if (url.endsWith('/schedule') && method === 'GET') {
    return ok(MOCK_SCHEDULE);
  }

  if (url.endsWith('/schedule/generate') && method === 'POST') {
    return ok(MOCK_SCHEDULE);
  }

  // --- Admin Endpoints (Super Admin) ---

  if (url.endsWith('/admin/super-admins') && method === 'GET') {
    const superAdmins = Object.values(MOCK_USERS).filter(u => u.role === Role.SuperAdmin);
    return page(superAdmins);
  }

  if (url.endsWith('/admin/super-admins/invitations') && method === 'GET') {
    return page(MOCK_SUPERADMIN_INVITATIONS);
  }

  if (url.endsWith('/admin/organizations') && method === 'GET') {
    return page(MOCK_ORGANIZATIONS);
  }

  // Default to 404 for unimplemented mock endpoints
  console.warn(`[MockInterceptor] Unhandled endpoint: ${method} ${url}`);
  return of(new HttpResponse({ status: 404, statusText: 'Not Found' })).pipe(delay(100));
}

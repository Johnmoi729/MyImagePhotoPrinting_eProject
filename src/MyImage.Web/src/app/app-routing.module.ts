
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './core/guards/admin.guard';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  // UPDATED: Default redirect to public home page for better UX
  {
    path: '',
    redirectTo: '/public',
    pathMatch: 'full'
  },

  // NEW: Public routes (no authentication required)
  {
    path: 'public',
    loadChildren: () => import('./features/public/public.module').then(m => m.PublicModule)
    // NOTE: No guards - these routes are completely public
  },

  // UPDATED: Authentication routes (public access but redirect if already logged in)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
    // NOTE: Auth routes handle their own redirect logic in components
  },

  // UPDATED: Legacy redirects for backward compatibility
  {
    path: 'login',
    redirectTo: '/auth/login'
  },
  {
    path: 'register',
    redirectTo: '/auth/register'
  },
  {
    path: 'home',
    redirectTo: '/public'
  },

  // PROTECTED: User routes requiring authentication
  {
    path: 'photos',
    loadChildren: () => import('./features/photo/photos.module').then(m => m.PhotosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'cart',
    loadChildren: () => import('./features/shopping/shopping.module').then(m => m.ShoppingModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'orders',
    loadChildren: () => import('./features/orders/orders.module').then(m => m.OrdersModule),
    canActivate: [AuthGuard]
  },

  // PROTECTED: Admin routes requiring authentication and admin role
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard, AdminGuard]
  },

  // UPDATED: Wildcard route redirects to public home instead of photos
  {
    path: '**',
    redirectTo: '/public'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // Router configuration for better SEO and debugging
    enableTracing: false, // Set to true for debugging route issues in development
    onSameUrlNavigation: 'reload',
    // NEW: Support for public pages and better initial navigation
    initialNavigation: 'enabledBlocking'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

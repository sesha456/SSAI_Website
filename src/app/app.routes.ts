import { Routes } from '@angular/router';
import { routeReadyGuard } from './core/guards/route-ready.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [routeReadyGuard],
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'SSAI | AI Student Innovation Society'
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
    title: 'About SSAI'
  },
  {
    path: 'leadership',
    loadComponent: () => import('./pages/leadership/leadership.component').then((m) => m.LeadershipComponent),
    title: 'SSAI Leadership'
  },
  {
    path: 'events',
    loadComponent: () => import('./pages/events/events.component').then((m) => m.EventsComponent),
    title: 'SSAI Events'
  },
  {
    path: 'events/:slug',
    loadComponent: () => import('./pages/dynamic-event-details/dynamic-event-details.component').then((m) => m.DynamicEventDetailsComponent),
    title: 'SSAI Event Details'
  },
  {
    path: 'past-events',
    loadComponent: () => import('./pages/past-events/past-events.component').then((m) => m.PastEventsComponent),
    title: 'SSAI Past Events'
  },
  {
    path: 'past-events/:slug',
    loadComponent: () => import('./pages/event-details/event-details.component').then((m) => m.EventDetailsComponent),
    title: 'SSAI Event Details'
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects.component').then((m) => m.ProjectsComponent),
    title: 'SSAI Projects and Research'
  },
  {
    path: 'gallery',
    loadComponent: () => import('./pages/gallery/gallery.component').then((m) => m.GalleryComponent),
    title: 'SSAI Gallery'
  },
  {
    path: 'media-library',
    loadComponent: () => import('./pages/media-library/media-library.component').then((m) => m.MediaLibraryComponent),
    title: 'SSAI Media Library'
  },
  {
    path: 'manage-officers',
    loadComponent: () => import('./pages/manage-officers/manage-officers.component').then((m) => m.ManageOfficersComponent),
    title: 'Manage SSAI Officers'
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
    title: 'SSAI Website Settings'
  },
  {
    path: 'join',
    loadComponent: () => import('./pages/join/join.component').then((m) => m.JoinComponent),
    title: 'Join SSAI'
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent),
    title: 'Contact SSAI'
  },
  {
    path: '**',
    redirectTo: ''
  }
];

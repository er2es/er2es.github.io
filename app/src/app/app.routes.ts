import { Routes } from '@angular/router';
import { Home } from './home';

/** The prerendered pages. Used on the server only, for route discovery; the browser bundle has no router. */
export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'hu', component: Home },
];

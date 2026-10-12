import { Routes } from '@angular/router';
import { Home } from './home';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full', data: { locale: 'en' } },
  { path: 'hu', component: Home, data: { locale: 'hu' } },
];

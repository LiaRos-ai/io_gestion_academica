import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'tabs/materias',
    loadComponent: () => import('./materias/materias.page').then(m => m.MateriasPage),
  },
  {
    path: 'tabs/notas',
    loadComponent: () => import('./notas/notas.page').then(m => m.NotasPage),
  },
  {
    path: 'tabs/horarios',
    loadComponent: () => import('./horarios/horarios.page').then(m => m.HorariosPage),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];

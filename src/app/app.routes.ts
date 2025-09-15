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
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },  {
    path: 'materias-sqlite',
    loadComponent: () => import('./pages/materias-sqlite/materias-sqlite.page').then( m => m.MateriasSqlitePage)
  },

];

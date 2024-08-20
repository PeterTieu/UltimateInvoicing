import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    importProvidersFrom(BrowserAnimationsModule), // Add this here
  ],
};

// // app.config.ts
// import { ApplicationConfig } from '@angular/core';
// import { provideRouter, Routes } from '@angular/router';
// import { QuotesListComponent } from './quote/quotes-list/quotes-list.component';
// import { HierarchicalDrawerComponent } from './shared/hierarchical-drawer/hierarchical-drawer.component';

// const routes: Routes = [
//   {
//     path: '',
//     component: HierarchicalDrawerComponent,
//     children: [
//       { path: '', component: QuotesListComponent },
//       // Add other routes as needed
//     ],
//   },
// ];

// export const appConfig: ApplicationConfig = {
//   providers: [provideRouter(routes)],
// };

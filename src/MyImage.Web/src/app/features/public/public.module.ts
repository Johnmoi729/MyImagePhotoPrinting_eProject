
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion'; // Expansion panel module
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';

// Components
import { AboutComponent } from './about/about.component';
import { HomeComponent } from './home/home.component';
import { HowItWorksComponent } from './how-it-works/how-it-works.component';
import { PricingComponent } from './pricing/pricing.component';
import { SampleGalleryComponent } from './sample-gallery/sample-gallery.component';

/**
 * Public module routes - these pages are accessible without authentication
 * and serve as the marketing/informational pages for the MyImage service.
 */
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'samples', component: SampleGalleryComponent },
  { path: 'how-it-works', component: HowItWorksComponent }
];

@NgModule({
  declarations: [
    HomeComponent,
    AboutComponent,
    PricingComponent,
    SampleGalleryComponent,
    HowItWorksComponent
  ],
  imports: [
    // Core Angular modules
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    // Angular Material Modules - comprehensive set for public pages
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatGridListModule,
    MatDividerModule,
    MatStepperModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatExpansionModule // FIXED: Added expansion module for FAQ panels in how-it-works component
  ]
})
export class PublicModule { }

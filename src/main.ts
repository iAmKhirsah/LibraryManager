import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from '@app/app.config';
import { App as AppComponent } from '@app/app';

bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
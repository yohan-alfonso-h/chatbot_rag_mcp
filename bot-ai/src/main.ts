import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { APP_RUNTIME_CONFIG, loadRuntimeConfig } from './app/app-runtime-config';

loadRuntimeConfig()
  .then((runtimeConfig) =>
    bootstrapApplication(App, {
      ...appConfig,
      providers: [
        ...(appConfig.providers ?? []),
        { provide: APP_RUNTIME_CONFIG, useValue: runtimeConfig },
      ],
    }),
  )
  .catch((err) => console.error(err));

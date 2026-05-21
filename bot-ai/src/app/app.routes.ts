import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',       
        loadComponent() {
            return import('./chat/chat').then((c) => c.Chat);
        },
    }
];

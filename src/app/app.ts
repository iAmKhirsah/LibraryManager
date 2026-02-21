import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '@components/navbar/navbar.component';
import { ThemeService } from '@services/theme.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div class="app-layout">
      <app-navbar />
      <main class="page-container">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .app-layout {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    main {
      flex: 1;
      overflow: hidden;
      padding-top: 24px;
    }
  `,
})
export class App {
  readonly theme = inject(ThemeService);
}

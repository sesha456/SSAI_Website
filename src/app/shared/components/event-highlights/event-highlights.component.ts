import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Highlight } from '../../models/content.models';

@Component({
  selector: 'app-event-highlights',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="highlight-grid">
      @for (highlight of highlights(); track highlight.title) {
        <article class="highlight glass">
          <div class="icon"><mat-icon>{{ highlight.icon }}</mat-icon></div>
          <h3>{{ highlight.title }}</h3>
          <p>{{ highlight.description }}</p>
        </article>
      }
    </div>
  `,
  styleUrl: './event-highlights.component.scss'
})
export class EventHighlightsComponent {
  readonly highlights = input.required<Highlight[]>();
}

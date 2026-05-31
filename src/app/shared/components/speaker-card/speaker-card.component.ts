import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Speaker } from '../../models/content.models';

@Component({
  selector: 'app-speaker-card',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <article class="speaker glass">
      <div class="avatar">{{ speaker().initials }}</div>
      <h3>{{ speaker().name }}</h3>
      <p>{{ speaker().designation }}</p>
      <strong>{{ speaker().organization }}</strong>
      <a [href]="speaker().linkedin" aria-label="LinkedIn profile"><mat-icon>work</mat-icon></a>
    </article>
  `,
  styleUrl: './speaker-card.component.scss'
})
export class SpeakerCardComponent {
  readonly speaker = input.required<Speaker>();
}

import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TeamMember } from '../../models/content.models';

@Component({
  selector: 'app-team-member-card',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <article class="team glass">
      <div class="avatar">
        @if (isImage(member().image)) {
          <img [src]="member().image" [alt]="member().name">
        } @else {
          <span>{{ member().image }}</span>
        }
      </div>
      <span class="pill">{{ member().type === 'faculty' ? member().department || member().group : member().group }}</span>
      <h3>{{ member().name }}</h3>
      <strong>{{ member().role }}</strong>
      @if (member().type !== 'faculty' && member().isCurrent === false && member().yearsServed) {
        <small>{{ member().yearsServed }}</small>
      }
      <p>{{ member().bio }}</p>
      <div class="links">
        @if (member().linkedin) {
          <a [href]="member().linkedin" target="_blank" rel="noreferrer" aria-label="LinkedIn"><mat-icon>work</mat-icon></a>
        }
        @if (member().github) {
          <a [href]="member().github" target="_blank" rel="noreferrer" aria-label="GitHub"><mat-icon>code</mat-icon></a>
        }
        @if (member().website) {
          <a [href]="member().website" target="_blank" rel="noreferrer" aria-label="Website"><mat-icon>language</mat-icon></a>
        }
      </div>
    </article>
  `,
  styleUrl: './team-member-card.component.scss'
})
export class TeamMemberCardComponent {
  readonly member = input.required<TeamMember>();

  isImage(value: string): boolean {
    return /^https?:\/\//.test(value) || value.startsWith('/assets/');
  }
}

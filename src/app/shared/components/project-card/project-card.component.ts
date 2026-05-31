import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProjectItem } from '../../models/content.models';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <article class="project glass">
      @if (project().image) {
        <div class="project__image" [style.background]="imageBackground(project().image!)"></div>
      }
      <span class="pill">{{ project().category }}</span>
      <h3>{{ project().title }}</h3>
      <p>{{ project().description }}</p>
      <div class="stack">
        @for (tech of project().techStack; track tech) { <span>{{ tech }}</span> }
      </div>
      <div class="contributors">{{ project().contributors.join(', ') }}</div>
      <div class="actions">
        <button class="ghost-btn" type="button" (click)="open.emit(project())"><mat-icon>open_in_full</mat-icon>Details</button>
        <a class="ghost-btn" [href]="project().github"><mat-icon>code</mat-icon>GitHub</a>
        <a class="primary-btn" [href]="project().demo"><mat-icon>play_arrow</mat-icon>Demo</a>
      </div>
    </article>
  `,
  styleUrl: './project-card.component.scss'
})
export class ProjectCardComponent {
  readonly project = input.required<ProjectItem>();
  readonly open = output<ProjectItem>();

  imageBackground(value: string): string {
    return /^https?:\/\//.test(value) || value.startsWith('/assets/') ? `url("${value}") center/cover` : value;
  }
}

import { Component, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GalleryItem } from '../../models/content.models';

@Component({
  selector: 'app-gallery-grid',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="masonry">
      @for (item of items(); track item.title) {
        <button class="tile glass" type="button" (click)="selected.set(item)">
          <span class="tile__art" [style.background]="item.image"></span>
          <span class="pill">{{ item.category }}</span>
          <strong>{{ item.title }}</strong>
        </button>
      }
    </div>

    @if (selected(); as item) {
      <div class="lightbox" (click)="selected.set(null)" role="dialog" aria-modal="true">
        <div class="lightbox__content glass" (click)="$event.stopPropagation()">
          <button class="close" type="button" aria-label="Close preview" (click)="selected.set(null)">
            <mat-icon>close</mat-icon>
          </button>
          <div class="preview" [style.background]="item.image"></div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.category }}</p>
        </div>
      </div>
    }
  `,
  styleUrl: './gallery-grid.component.scss'
})
export class GalleryGridComponent {
  readonly items = input.required<GalleryItem[]>();
  readonly selected = signal<GalleryItem | null>(null);
}

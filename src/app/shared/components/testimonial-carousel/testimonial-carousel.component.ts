import { Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Testimonial } from '../../models/content.models';

@Component({
  selector: 'app-testimonial-carousel',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <section class="testimonial glass">
      @if (active(); as item) {
        <p>“{{ item.quote }}”</p>
        <strong>{{ item.name }}</strong>
        <span>{{ item.role }}</span>
      }
      <div class="controls">
        <button type="button" (click)="previous()" aria-label="Previous testimonial"><mat-icon>chevron_left</mat-icon></button>
        <button type="button" (click)="next()" aria-label="Next testimonial"><mat-icon>chevron_right</mat-icon></button>
      </div>
    </section>
  `,
  styles: [`
    .testimonial { position: relative; padding: clamp(1.2rem, 4vw, 2rem); border-radius: 1rem; }
    p { margin: 0 0 1rem; font-size: clamp(1.2rem, 3vw, 1.8rem); line-height: 1.5; }
    strong, span { display: block; }
    span { margin-top: .25rem; color: var(--muted); }
    .controls { display: flex; gap: .5rem; margin-top: 1.2rem; }
    button { display: grid; width: 2.6rem; height: 2.6rem; place-items: center; border: 1px solid var(--line); border-radius: .8rem; background: rgba(255,255,255,.07); color: var(--text); cursor: pointer; }
  `]
})
export class TestimonialCarouselComponent {
  readonly testimonials = input.required<Testimonial[]>();
  readonly index = signal(0);
  readonly active = computed(() => this.testimonials()[this.index()]);

  next(): void {
    this.index.update((value) => (value + 1) % this.testimonials().length);
  }

  previous(): void {
    this.index.update((value) => (value - 1 + this.testimonials().length) % this.testimonials().length);
  }
}

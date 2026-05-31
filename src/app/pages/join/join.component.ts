import { Component } from '@angular/core';
import { JoinFormComponent } from '../../shared/components/join-form/join-form.component';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [JoinFormComponent],
  template: `
    <section class="section page">
      <div class="section__inner layout reveal">
        <div>
          <span class="eyebrow">Join SSAI</span>
          <h1 class="section-title">Find your place in an AI community built for learning and leadership.</h1>
          <p class="section-copy">Members participate in research teams, volunteer programs, speaker sessions, technical workshops, and industry networking.</p>
          <div class="benefits">
            @for (benefit of benefits; track benefit) { <span class="pill">{{ benefit }}</span> }
          </div>
        </div>
        <app-join-form />
      </div>
    </section>
  `,
  styleUrl: './join.component.scss'
})
export class JoinComponent {
  readonly benefits = ['Membership benefits', 'Volunteer opportunities', 'Research opportunities', 'Industry networking', 'Leadership opportunities'];
}

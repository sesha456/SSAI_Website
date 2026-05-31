import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ContentService } from '../../core/services/content.service';
import { OfficerSessionService } from '../../core/services/officer-session.service';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { ProjectItem } from '../../shared/models/content.models';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, ProjectCardComponent, MatIconModule],
  template: `
    <section class="section page">
      <div class="section__inner reveal">
        <span class="eyebrow">{{ content.siteContent.projectsHero.eyebrow }}</span>
        <h1 class="section-title">{{ content.siteContent.projectsHero.title }}</h1>
        <p class="section-copy">{{ content.siteContent.projectsHero.copy }}</p>
        @if (officer.isOfficer()) {
          <button class="edit-heading" type="button" (click)="openHeroEditor()"><mat-icon>edit</mat-icon>Edit</button>
        }
        <div class="toolbar glass">
          <input type="search" placeholder="Search projects" [value]="query()" (input)="query.set($any($event.target).value)">
          <div class="filters">
            @for (category of categories; track category) {
              <button type="button" class="pill" [class.active]="selected() === category" (click)="selected.set(category)">{{ category }}</button>
            }
          </div>
        </div>
        @if (officer.isOfficer()) {
          <div class="admin-bar glass">
            <span>{{ content.saveMessage() || 'Officer editing enabled' }}</span>
            <button class="primary-btn" type="button" (click)="openAdd()">Add Project</button>
            <button class="ghost-btn" type="button" (click)="content.exportJson('projects.json', content.projects)">Export Updated JSON</button>
          </div>
        }
        <div class="card-grid top-gap">
          @for (project of filteredProjects(); track project.id) {
            <div class="managed-card">
              <app-project-card [project]="project" (open)="activeProject.set($event)" />
              @if (officer.isOfficer()) {
                <div class="manage-actions">
                  <button type="button" (click)="openEdit(project)" aria-label="Edit project"><mat-icon>edit</mat-icon></button>
                  <button type="button" (click)="deleteProject(project.id)" aria-label="Delete project"><mat-icon>delete</mat-icon></button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>

    @if (editorOpen()) {
      <div class="modal">
        <form class="editor glass" [formGroup]="form" (ngSubmit)="saveProject()">
          <h2>{{ editingId() === null ? 'Add Project' : 'Edit Project' }}</h2>
          <mat-form-field appearance="outline"><mat-label>Project Name</mat-label><input matInput formControlName="title"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Domain</mat-label><mat-select formControlName="category">@for (category of categoriesForForm; track category) { <mat-option [value]="category">{{ category }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Description</mat-label><textarea matInput rows="4" formControlName="description"></textarea></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Technologies (comma separated)</mat-label><input matInput formControlName="techStack"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Contributors (comma separated)</mat-label><input matInput formControlName="contributors"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>GitHub Link</mat-label><input matInput formControlName="github"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Demo Link</mat-label><input matInput formControlName="demo"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Image</mat-label><input matInput formControlName="image"></mat-form-field>
          <div class="editor-actions">
            <button class="ghost-btn" type="button" (click)="editorOpen.set(false)">Cancel</button>
            <button class="primary-btn" type="submit">Save</button>
          </div>
        </form>
      </div>
    }

    @if (activeProject(); as project) {
      <div class="modal" (click)="activeProject.set(null)">
        <article class="modal__content glass" (click)="$event.stopPropagation()">
          <button class="close" type="button" (click)="activeProject.set(null)" aria-label="Close project details"><mat-icon>close</mat-icon></button>
          <span class="pill">{{ project.category }}</span>
          <h2>{{ project.title }}</h2>
          <p>{{ project.details }}</p>
          <div class="stack">@for (tech of project.techStack; track tech) { <span>{{ tech }}</span> }</div>
          <strong>Contributors: {{ project.contributors.join(', ') }}</strong>
          <div class="actions">
            <a class="ghost-btn" [href]="project.github">GitHub</a>
            <a class="primary-btn" [href]="project.demo">Demo</a>
          </div>
        </article>
      </div>
    }

    @if (heroEditorOpen()) {
      <div class="modal">
        <form class="editor glass" [formGroup]="heroForm" (ngSubmit)="saveHero()">
          <h2>Edit Page Heading</h2>
          <mat-form-field appearance="outline"><mat-label>Eyebrow</mat-label><input matInput formControlName="eyebrow"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Heading</mat-label><input matInput formControlName="title"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Content</mat-label><textarea matInput rows="5" formControlName="copy"></textarea></mat-form-field>
          <div class="editor-actions">
            <button class="ghost-btn" type="button" (click)="heroEditorOpen.set(false)">Cancel</button>
            <button class="primary-btn" type="submit">Save</button>
          </div>
        </form>
      </div>
    }
  `,
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent {
  private readonly fb = new FormBuilder();
  readonly content = inject(ContentService);
  readonly officer = inject(OfficerSessionService);
  readonly query = signal('');
  readonly selected = signal<ProjectItem['category'] | 'All'>('All');
  readonly activeProject = signal<ProjectItem | null>(null);
  readonly categories: Array<ProjectItem['category'] | 'All'> = ['All', 'Healthcare AI', 'Drug Discovery', 'RAG Systems', 'NLP', 'Computer Vision', 'AI Agents', 'Robotics'];
  readonly categoriesForForm: ProjectItem['category'][] = ['Healthcare AI', 'Drug Discovery', 'RAG Systems', 'NLP', 'Computer Vision', 'AI Agents', 'Robotics'];
  readonly editorOpen = signal(false);
  readonly heroEditorOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly heroForm = this.fb.nonNullable.group({
    eyebrow: ['', Validators.required],
    title: ['', Validators.required],
    copy: ['', Validators.required]
  });
  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    category: ['Healthcare AI' as ProjectItem['category'], Validators.required],
    description: ['', Validators.required],
    techStack: ['', Validators.required],
    contributors: [''],
    github: [''],
    demo: [''],
    image: ['']
  });
  readonly filteredProjects = computed(() => {
    this.content.version();
    const category = this.selected();
    const query = this.query().trim().toLowerCase();
    return this.content.projects.filter((project) => {
      const categoryMatch = category === 'All' || project.category === category;
      const haystack = `${project.title} ${project.domain} ${project.techStack.join(' ')} ${project.contributors.join(' ')}`.toLowerCase();
      return categoryMatch && (!query || haystack.includes(query));
    });
  });

  openAdd(): void {
    if (!this.officer.requireActiveSession()) return;
    this.editingId.set(null);
    this.form.reset({ category: 'Healthcare AI' });
    this.editorOpen.set(true);
  }

  openHeroEditor(): void {
    if (!this.officer.requireActiveSession()) return;
    this.heroForm.setValue(this.content.siteContent.projectsHero);
    this.heroEditorOpen.set(true);
  }

  saveHero(): void {
    if (!this.officer.requireActiveSession() || this.heroForm.invalid) {
      this.heroForm.markAllAsTouched();
      return;
    }
    this.content.updateHero('projectsHero', this.heroForm.getRawValue());
    this.heroEditorOpen.set(false);
  }

  openEdit(project: ProjectItem): void {
    if (!this.officer.requireActiveSession()) return;
    this.editingId.set(project.id);
    this.form.setValue({
      title: project.title,
      category: project.category,
      description: project.description,
      techStack: project.techStack.join(', '),
      contributors: project.contributors.join(', '),
      github: project.github,
      demo: project.demo,
      image: project.image ?? ''
    });
    this.editorOpen.set(true);
  }

  saveProject(): void {
    if (!this.officer.requireActiveSession() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const project: ProjectItem = {
      id: this.editingId() ?? 0,
      title: value.title,
      domain: value.category,
      category: value.category,
      techStack: this.csv(value.techStack),
      description: value.description,
      details: value.description,
      contributors: this.csv(value.contributors),
      github: value.github,
      demo: value.demo,
      image: value.image
    };
    const id = this.editingId();
    if (id === null) {
      this.content.addProject(project);
    } else {
      this.content.updateProject(id, project);
    }
    this.editorOpen.set(false);
  }

  deleteProject(id: number): void {
    if (this.officer.requireActiveSession()) {
      this.content.deleteProject(id);
    }
  }

  private csv(value: string): string[] {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}

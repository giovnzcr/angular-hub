import { Component, Input } from '@angular/core';
import { ContentFile, injectContentFiles } from '@analogjs/content';
import { AsyncPipe, NgForOf } from '@angular/common';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { SearchBarComponent } from '../../components/search-bar.component';
import { debounceTime, distinctUntilChanged, map, tap } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Podcast } from '../../models/podcast.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatListModule } from '@angular/material/list';
import { PodcastCardComponent } from '../../components/cards/podcast-card.component';
import { RouteMeta } from '@analogjs/router';
import { HeaderService } from '../../services/header.service';

export const routeMeta: RouteMeta = {
  meta: [
    {
      name: 'description',
      content: 'Curated list of Angular Talks',
    },
  ],
  data: {
    header: 'Podcasts',
  },
};

@Component({
  selector: 'app-podcasts',
  standalone: true,
  imports: [
    NgForOf,
    RouterLink,
    SearchBarComponent,
    RouterLinkActive,
    AsyncPipe,
    ReactiveFormsModule,
    MatListModule,
    PodcastCardComponent,
  ],
  template: `
    <app-search-bar [formControl]="searchControl"></app-search-bar>
    <mat-nav-list>
      <a
        mat-list-item
        *ngFor="let podcast of podcasts$ | async; trackBy: trackbyFn"
        [attr.aria-labelledby]="podcast.attributes.title"
        [href]="podcast.attributes.url"
        target="_blank"
      >
        <app-podcast-card [podcast]="podcast.attributes"></app-podcast-card>
      </a>
    </mat-nav-list>
  `,
  styles: `
    .active {
      background-color: #BF25B9;
      color: white;
      border-radius: 0.5rem;
    }
  `,
})
export default class PodcastsComponent {
  searchControl = new FormControl<string>('', { nonNullable: true });
  podcasts = injectContentFiles<Podcast>(({ filename }) =>
    filename.startsWith('/src/content/podcasts/')
  );

  podcasts$ = this.route.queryParams.pipe(
    tap(({ search = '' }) =>
      this.searchControl.setValue(search, { emitEvent: false })
    ),
    map(({ search: searchTerm = '' }) => {
      return this.podcasts.filter((podcast) =>
        this.filterPredicate(podcast.attributes, searchTerm)
      );
    })
  );

  @Input() set header(header: string) {
    this.headerService.setHeaderTitle(header);
  }

  constructor(
    private headerService: HeaderService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        void this.router.navigate(['.'], {
          queryParams: { search: value || null },
          queryParamsHandling: 'merge',
          relativeTo: this.route,
        });
      });
  }

  filterPredicate(podcast: Podcast, searchTerm: string): boolean {
    if (searchTerm === '') {
      return true;
    }

    return podcast.title.toLowerCase().includes(searchTerm.toLowerCase());
  }

  // TODO : to be removed with control flow update
  trackbyFn(index: number, podcast: ContentFile<Podcast>): string {
    return podcast.attributes.title;
  }
}

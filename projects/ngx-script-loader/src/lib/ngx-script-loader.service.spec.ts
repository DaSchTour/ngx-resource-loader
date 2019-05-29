import { TestBed } from '@angular/core/testing';

import { NgxScriptLoaderService } from './ngx-script-loader.service';

describe('NgxScriptLoaderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NgxScriptLoaderService = TestBed.get(NgxScriptLoaderService);
    expect(service).toBeTruthy();
  });
});

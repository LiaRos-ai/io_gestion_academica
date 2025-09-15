import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MateriasSqlitePage } from './materias-sqlite.page';

describe('MateriasSqlitePage', () => {
  let component: MateriasSqlitePage;
  let fixture: ComponentFixture<MateriasSqlitePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MateriasSqlitePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

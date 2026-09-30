import { describe, expect, it } from 'vitest';
import { categoryStatusForm, courseMaterialStatusForm, escapeRegex, noticeFor, listQuery, subCategoryStatusForm } from './catalogue';
import type { CategoryRow, CourseMaterialRow, SubCategoryRow } from './types';

const base = { per: 10, nameParam: 'categoryName', typeParam: true };

describe('escapeRegex', () => {
  it('neutralises regular-expression characters', () => {
    expect(escapeRegex('a.b(c)*')).toBe('a\\.b\\(c\\)\\*');
    expect(escapeRegex('plain')).toBe('plain');
  });
});

describe('listQuery', () => {
  it('sends only page and limit by default', () => {
    expect(listQuery({ ...base, page: 1, q: '', tab: 'all' })).toBe('page=1&limit=10');
  });
  it('adds search, status and type', () => {
    const s = new URLSearchParams(listQuery({ ...base, page: 2, q: ' Cats ', tab: 'off', type: 'kid' }));
    expect(s.get('categoryName')).toBe('Cats');
    expect(s.get('isActive')).toBe('false');
    expect(s.get('type')).toBe('kid');
    expect(s.get('page')).toBe('2');
  });
  it('escapes the search word and skips type when unsupported', () => {
    const s = new URLSearchParams(listQuery({ ...base, nameParam: 'subCategoryName', typeParam: false, page: 1, q: 'a(b', tab: 'on', type: 'kid' }));
    expect(s.get('subCategoryName')).toBe('a\\(b');
    expect(s.get('isActive')).toBe('true');
    expect(s.has('type')).toBe(false);
  });
});

describe('status forms', () => {
  it('keeps every field of a category and flips the status', () => {
    const c = { _id: '1', categoryName: 'Art', sorting: 3, type: 'kid', description: 'd', isActive: true, packageId: { _id: 'p', packageName: 'P' } } as CategoryRow;
    const fd = categoryStatusForm(c, false);
    expect(fd.get('categoryName')).toBe('Art');
    expect(fd.get('sorting')).toBe('3');
    expect(fd.get('packageId')).toBe('p');
    expect(fd.get('isActive')).toBe('false');
    expect(fd.has('image')).toBe(false);
  });
  it('keeps every field of a sub category', () => {
    const s = { _id: '1', subCategoryName: 'Sk', sorting: 1, type: 'parent', isActive: false, categoryId: { _id: 'c', categoryName: 'C' } } as SubCategoryRow;
    const fd = subCategoryStatusForm(s, true);
    expect(fd.get('categoryId')).toBe('c');
    expect(fd.get('description')).toBe('');
    expect(fd.get('isActive')).toBe('true');
  });
});

describe('noticeFor', () => {
  it('words known notices and ignores anything else', () => {
    expect(noticeFor('created', 'Category')).toBe('Category created.');
    expect(noticeFor('deleted', 'Sub category')).toBe('Sub category deleted.');
    expect(noticeFor('<script>', 'Category')).toBeUndefined();
    expect(noticeFor(undefined, 'Category')).toBeUndefined();
  });
});

describe('courseMaterialStatusForm', () => {
  it('keeps the link and both parents', () => {
    const m = { _id: '1', courseMaterialName: 'V', courseMaterialUrl: 'https://vimeo.com/1', sorting: 2, type: 'kid', isActive: true, subCategoryId: { _id: 's', subCategoryName: 'S', categoryId: { _id: 'c', categoryName: 'C' } } } as CourseMaterialRow;
    const fd = courseMaterialStatusForm(m, false);
    expect(fd.get('courseMaterialUrl')).toBe('https://vimeo.com/1');
    expect(fd.get('categoryId')).toBe('c');
    expect(fd.get('subCategoryId')).toBe('s');
    expect(fd.get('isActive')).toBe('false');
  });
});

import type { CategoryRow, SubCategoryRow } from './types';

/** The backend feeds the search word into a regular expression, so special characters are escaped first. */
export const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export type StatusTab = 'all' | 'on' | 'off';

export interface ListQuery { page: number; per: number; q: string; tab: StatusTab; type?: '' | 'kid' | 'parent'; nameParam: string; typeParam: boolean }

/** Builds the list query string: page, search word, status and (categories only) type. */
export function listQuery({ page, per, q, tab, type, nameParam, typeParam }: ListQuery): string {
  const p = new URLSearchParams({ page: String(page), limit: String(per) });
  const term = q.trim();
  if (term) p.set(nameParam, escapeRegex(term));
  if (tab !== 'all') p.set('isActive', String(tab === 'on'));
  if (typeParam && type) p.set('type', type);
  return p.toString();
}

/** The backend needs every field on update, so a status change resends the whole record (without touching the image). */
export function categoryStatusForm(c: CategoryRow, isActive: boolean): FormData {
  const fd = new FormData();
  fd.append('categoryName', c.categoryName);
  fd.append('sorting', String(c.sorting));
  fd.append('packageId', c.packageId?._id ?? '');
  fd.append('type', c.type);
  fd.append('description', c.description ?? '');
  fd.append('isActive', String(isActive));
  return fd;
}

export function subCategoryStatusForm(s: SubCategoryRow, isActive: boolean): FormData {
  const fd = new FormData();
  fd.append('subCategoryName', s.subCategoryName);
  fd.append('sorting', String(s.sorting));
  fd.append('categoryId', s.categoryId?._id ?? '');
  fd.append('type', s.type);
  fd.append('description', s.description ?? '');
  fd.append('isActive', String(isActive));
  return fd;
}

/** Message for the `?notice=` value left by a form or delete, e.g. noticeFor('created', 'Category') → "Category created." */
export function noticeFor(key: string | undefined, noun: string): string | undefined {
  const verbs: Record<string, string> = { created: 'created', saved: 'saved', deleted: 'deleted' };
  return key && verbs[key] ? `${noun} ${verbs[key]}.` : undefined;
}

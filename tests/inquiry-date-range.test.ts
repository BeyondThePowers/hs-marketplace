import assert from 'node:assert/strict';
import test from 'node:test';

import { hasStrictDateOrder, inquiryCalendarBounds, inquiryDateConstraints, shiftIsoDate } from '../src/lib/inquiry-date-range.ts';

test('requires the end date to be later than the start date', () => {
  assert.equal(hasStrictDateOrder('2026-08-10', '2026-08-11'), true);
  assert.equal(hasStrictDateOrder('2026-08-10', '2026-08-10'), false);
  assert.equal(hasStrictDateOrder('2026-08-10', '2026-08-09'), false);
});

test('constrains the end date when the start date is chosen first', () => {
  assert.deepEqual(inquiryDateConstraints({
    today: '2026-08-05',
    start: '2026-08-10',
  }), {
    startMin: '2026-08-05',
    startMax: null,
    endMin: '2026-08-11',
    endMax: null,
  });
});

test('constrains the start date when the end date is chosen first', () => {
  assert.deepEqual(inquiryDateConstraints({
    today: '2026-08-05',
    end: '2026-08-20',
  }), {
    startMin: '2026-08-05',
    startMax: '2026-08-19',
    endMin: '2026-08-06',
    endMax: null,
  });
});

test('reserves the final published day for an end date', () => {
  assert.deepEqual(inquiryDateConstraints({
    today: '2026-08-05',
    calendarMaximum: '2026-12-31',
  }), {
    startMin: '2026-08-05',
    startMax: '2026-12-30',
    endMin: '2026-08-06',
    endMax: '2026-12-31',
  });
});

test('derives picker boundaries from actual allow-listed dates', () => {
  const bounds = inquiryCalendarBounds({
    years: [{ year: 2026, mode: 'allow' }],
    dates: ['2026-05-28', '2026-08-12', '2026-08-13'],
  }, '2026-08-05');

  assert.deepEqual(bounds, {
    minimum: '2026-08-12',
    maximum: '2026-08-13',
  });
  assert.deepEqual(inquiryDateConstraints({
    today: '2026-08-05',
    calendarMinimum: bounds?.minimum,
    calendarMaximum: bounds?.maximum,
  }), {
    startMin: '2026-08-12',
    startMax: '2026-08-12',
    endMin: '2026-08-13',
    endMax: '2026-08-13',
  });
});

test('derives block-list boundaries from the configured year', () => {
  assert.deepEqual(inquiryCalendarBounds({
    years: [{ year: 2026, mode: 'block' }],
    dates: ['2026-08-05', '2026-12-31'],
  }, '2026-08-05'), {
    minimum: '2026-08-06',
    maximum: '2026-12-30',
  });
});

test('shifts dates safely across month and leap-year boundaries', () => {
  assert.equal(shiftIsoDate('2028-02-28', 1), '2028-02-29');
  assert.equal(shiftIsoDate('2028-03-01', -1), '2028-02-29');
});

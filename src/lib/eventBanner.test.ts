import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEventBanner } from './eventBanner';

test('normalizeEventBanner returns bannerUrl from coverImage when available', () => {
  const event = {
    id: 'evt-1',
    title: 'Launch Party',
    coverImage: 'https://cdn.example.com/banner.jpg',
  };

  assert.equal(normalizeEventBanner(event), 'https://cdn.example.com/banner.jpg');
});

test('normalizeEventBanner preserves an explicit bannerUrl', () => {
  const event = {
    id: 'evt-2',
    title: 'Launch Party',
    bannerUrl: 'https://cdn.example.com/explicit-banner.jpg',
    coverImage: 'https://cdn.example.com/cover.jpg',
  };

  assert.equal(normalizeEventBanner(event), 'https://cdn.example.com/explicit-banner.jpg');
});

import { describe, expect, it } from 'vitest';
import {
  isLadderAvatarDataUrl,
  isLadderAvatarHttpsUrl,
  ladderAvatarDataUrlToBlob,
} from '../ladderAvatarUrl';

describe('ladderAvatarUrl', () => {
  it('detects data and https avatars', () => {
    expect(isLadderAvatarDataUrl('data:image/jpeg;base64,abcd')).toBe(true);
    expect(isLadderAvatarDataUrl('https://cdn.example.com/a.jpg')).toBe(false);
    expect(isLadderAvatarHttpsUrl('https://cdn.example.com/a.jpg')).toBe(true);
  });

  it('decodes jpeg data URL to blob', () => {
    const dataUrl =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';
    const blob = ladderAvatarDataUrlToBlob(dataUrl);
    expect(blob.type).toBe('image/jpeg');
    expect(blob.size).toBeGreaterThan(0);
  });
});

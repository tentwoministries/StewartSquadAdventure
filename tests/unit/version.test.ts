import { describe, expect, it } from 'vitest';
import { GAME_TITLE, GAME_VERSION } from '../../src/engine/version';

describe('scaffold', () => {
  it('exposes a title and version stamp', () => {
    expect(GAME_TITLE).toBe('Stewart Squad Adventure');
    expect(GAME_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});

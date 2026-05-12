import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(__dirname, '../../public/data');

const SCENES = [
  'classroom',
  'airport_start', 'airport_finland', 'airport_canada', 'airport_dubai', 'airport_egypt',
  'country_finland_outdoor', 'country_finland_indoor',
  'country_canada_outdoor', 'country_canada_indoor',
  'country_dubai_outdoor', 'country_dubai_indoor',
  'country_egypt_outdoor', 'country_egypt_indoor',
  'worldmap', 'ending',
];

describe('scene node JSON', () => {
  SCENES.forEach(scene => {
    it(`${scene} 파일이 존재하고 유효한 JSON이다`, () => {
      const filepath = path.join(DATA_DIR, `nodes-${scene}.json`);
      expect(fs.existsSync(filepath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      expect(content.scene).toBe(scene);
      expect(content.startNode).toBeTruthy();
      expect(Array.isArray(content.nodes)).toBe(true);
      expect(content.nodes.length).toBeGreaterThan(0);
    });
  });
});

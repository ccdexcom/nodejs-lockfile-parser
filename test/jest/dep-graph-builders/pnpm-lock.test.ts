import { createFromJSON } from '@snyk/dep-graph';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parsePnpmLockFile } from '../../../lib/dep-graph-builders/pnpm-lock/dep-graph';
import { readWantedLockfileAndAutofixConflicts } from '@pnpm/lockfile-file';

describe('pnpm-lock.yaml "real" projects', () => {
  describe.each(['goof'])('[simple tests] project: %s ', (fixtureName) => {
    test('matches expected', async () => {
      const pkgJsonContent = readFileSync(
        join(
          __dirname,
          `./fixtures/pnpm-lock/real/${fixtureName}/package.json`,
        ),
        'utf8',
      );

      const { lockfile } = await readWantedLockfileAndAutofixConflicts(
        join(__dirname, `./fixtures/pnpm-lock/real/${fixtureName}`),
        { ignoreIncompatible: false },
      );

      const dg = await parsePnpmLockFile(
        JSON.parse(pkgJsonContent),
        lockfile!,
        {
          includeDevDeps: false,
          includeOptionalDeps: true,
          pruneCycles: true,
          strictOutOfSync: false,
        },
      );

      const expectedDepGraphJson = JSON.parse(
        readFileSync(
          join(
            __dirname,
            `./fixtures/pnpm-lock/real/${fixtureName}/expected.json`,
          ),
          'utf8',
        ),
      );

      expect(dg).toBeTruthy();
      // writeFileSync('new.json', JSON.stringify(dg.toJSON(), null, 2));
      const expectedDepGraph = createFromJSON(expectedDepGraphJson);
      expect(dg.toJSON()).toEqual(expectedDepGraph.toJSON());
    });
  });
});

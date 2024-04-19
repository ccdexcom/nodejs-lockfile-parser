import { lockfileWalker } from '@pnpm/lockfile-walker';
import { Lockfile as PnpmLockFile } from '@pnpm/lockfile-types';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';

const rawPnpmLock: PnpmLockFile = load(readFileSync('pnpm-lock.yaml'));
console.log(rawPnpmLock);

lockfileWalker(rawPnpmLock, []);

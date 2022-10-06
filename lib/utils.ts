import { readFileSync } from 'fs';
import { InvalidUserInputError } from './errors';

export enum NodeLockfileVersion {
  NpmLockV1 = 'NPM_LOCK_V1',
  NpmLockV2 = 'NPM_LOCK_V2',
  NpmLockV3 = 'NPM_LOCK_V3',
  YarnLockV1 = 'YARN_LOCK_V1',
  YarnLockV2 = 'YARN_LOCK_V2',
}

export const getLockfileVersionFromFile = (
  targetFile: string,
): NodeLockfileVersion => {
  const lockFileContents = readFileSync(targetFile, 'utf-8');
  if (targetFile.endsWith('package-lock.json')) {
    return getNpmLockfileVersion(lockFileContents);
  } else if (targetFile.endsWith('yarn.lock')) {
    return getYarnLockfileVersion(lockFileContents);
  } else {
    throw new InvalidUserInputError(
      `Unknown lockfile ${targetFile}. ` +
        'Please provide either package-lock.json or yarn.lock.',
    );
  }
};

export function getYarnLockfileVersion(
  lockFileContents: string,
): NodeLockfileVersion.YarnLockV1 | NodeLockfileVersion.YarnLockV2 {
  if (lockFileContents.includes('__metadata')) {
    return NodeLockfileVersion.YarnLockV2;
  } else {
    return NodeLockfileVersion.YarnLockV1;
  }
}

export function getNpmLockfileVersion(
  lockFileContents: string,
):
  | NodeLockfileVersion.NpmLockV1
  | NodeLockfileVersion.NpmLockV2
  | NodeLockfileVersion.NpmLockV3 {
  if (lockFileContents.includes(`"lockfileVersion": 1,`)) {
    return NodeLockfileVersion.NpmLockV1;
  } else if (lockFileContents.includes(`"lockfileVersion": 2,`)) {
    return NodeLockfileVersion.NpmLockV2;
  } else if (lockFileContents.includes(`"lockfileVersion": 3,`)) {
    return NodeLockfileVersion.NpmLockV3;
  } else {
    throw new InvalidUserInputError(
      `Unsupported npm lockfile version in package-lock.json. ` +
        'Please provide a package-lock.json with lockfileVersion 1, 2 or 3',
    );
  }
}

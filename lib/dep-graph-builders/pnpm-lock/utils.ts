import { Lockfile, ProjectSnapshot } from '@pnpm/lockfile-types';
import {
  LockedDependency,
  LockfileWalkerStep,
  lockfileWalker,
} from '@pnpm/lockfile-walker';

import { nameVerFromPkgSnapshot } from '@pnpm/lockfile-utils';
import { DepGraphBuilder } from '@snyk/dep-graph';
import { PackageJsonBase } from '../types';
import { Dependencies } from '../util';

export interface VisitorNode {
  id: string;
  name: string;
  version: string;
  step: LockfileWalkerStep;
  dependencies: Dependencies;
  isDev: boolean;
  isOptional: boolean;
  missingLockFileEntry?: boolean;
  inBundle?: boolean;
  key?: string;
}

export type VisitContext = {
  rootPkgJson: PackageJsonBase;
  lockfile: Lockfile;
  graphBuilder: DepGraphBuilder;
  visitMap: Map<string, VisitorNode>;
  importer: ProjectSnapshot;
  step?: LockfileWalkerStep;
};

export function getStepForImporterId(
  lockfile: Lockfile,
  importerId: string,
): LockfileWalkerStep {
  const { step } = lockfileWalker(lockfile, [importerId], {
    include: {
      dependencies: true,
      optionalDependencies: true,
      devDependencies: true,
    },
    skipped: new Set(),
  });

  return step;
}

export function getImporterIds(lockfile: Lockfile) {
  return Object.keys(lockfile.importers);
}

export function createChildNode(
  dependency: LockedDependency,
  context: VisitContext,
): VisitorNode {
  const { name, version } = nameVerFromPkgSnapshot(
    dependency.depPath,
    dependency.pkgSnapshot,
  );

  const step = dependency.next();
  const childDependencies = getPkgDependenciesFromStep(step);

  const isDev = Boolean(context.importer.devDependencies?.[name]);
  const isOptional = Boolean(context.importer.optionalDependencies?.[name]);

  return {
    id: `${name}@${version}`,
    step,
    name,
    isDev,
    isOptional,
    version,
    dependencies: childDependencies,
  };
}

export function getPkgDependenciesFromStep(
  step: LockfileWalkerStep,
): Dependencies {
  const dependencies: Dependencies = {};

  for (const subDependency of step.dependencies) {
    const { name, version } = nameVerFromPkgSnapshot(
      subDependency.depPath,
      subDependency.pkgSnapshot,
    );
    dependencies[name] = { version, isDev: false };
  }

  return dependencies;
}

import { DepGraph, DepGraphBuilder } from '@snyk/dep-graph';
import {
  DepGraphBuildOptions,
  PackageJsonBase,
  ProjectParseOptions,
} from '../types';
import {
  getStepForImporterId,
  getImporterIds,
  getPkgDependenciesFromStep,
  createChildNode,
  VisitContext,
  VisitorNode,
} from './utils';
import { Lockfile } from '@pnpm/lockfile-types';

export function parsePnpmLockFile(
  pkgJson: PackageJsonBase,
  lockfile: Lockfile,
  options: ProjectParseOptions,
): DepGraph {
  const graphBuilder = new DepGraphBuilder(
    { name: 'pnpm' },
    { name: pkgJson.name, version: pkgJson.version },
  );

  const visitMap = new Map();

  const importerIds = getImporterIds(lockfile);

  for (const importerId of importerIds) {
    const importer = lockfile.importers[importerId];

    buildDepGraphForImporterId(
      importerId,
      { rootPkgJson: pkgJson, visitMap, lockfile, graphBuilder, importer },
      options,
    );
  }

  return graphBuilder.build();
}

export function buildDepGraphForImporterId(
  importerId: string,
  context: VisitContext,
  options: ProjectParseOptions,
): void {
  const step = getStepForImporterId(context.lockfile, importerId);

  const rootNode: VisitorNode = {
    id: 'root-node',
    version: 'root version', // TODO: get from root importer's package.json
    name: 'root node name', // TODO: get from root importer's package.json
    dependencies: getPkgDependenciesFromStep(step),
    isDev: false,
    isOptional: false,
    step,
  };

  visitNode(rootNode, { ...context, step }, options);
}

export function visitNode(
  node: VisitorNode,
  context: VisitContext,
  options: DepGraphBuildOptions,
): void {
  const { visitMap, graphBuilder } = context;

  for (const childDependency of node.step.dependencies) {
    const childNode = createChildNode(childDependency, context);
    const passesDevCheck =
      !childNode.isDev || (childNode.isDev && options.includeDevDeps);
    const passesOptionalCheck =
      !childNode.isOptional ||
      (childNode.isOptional && options.includeOptionalDeps);

    if (!passesDevCheck || !passesOptionalCheck) {
      continue;
    }

    if (!visitMap.has(childNode.id)) {
      visitMap.set(childNode.id, childNode);

      graphBuilder.addPkgNode(
        { name: childNode.name, version: childNode.version },
        childNode.id,
        { labels: { scope: childNode.isDev ? 'dev' : 'prod' } },
      );
    }

    graphBuilder.connectDep(node.id, childNode.id);
    visitNode(childNode, context, options);
  }
}

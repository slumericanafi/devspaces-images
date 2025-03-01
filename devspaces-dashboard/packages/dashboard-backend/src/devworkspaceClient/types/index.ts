/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import {
  V1alpha2DevWorkspace,
  V1alpha2DevWorkspaceTemplate,
  V220DevfileComponents,
} from '@devfile/api';
import { api } from '@eclipse-che/common';
import * as k8s from '@kubernetes/client-node';

/**
 * Holds the methods for working with dockerconfig for devworkspace
 * which is stored in Kubernetes Secret and is annotated in DevWorkspace operator specific way.
 */
export interface IDockerConfigApi {
  /**
   * Get DockerConfig in the specified namespace
   */
  read(namespace: string): Promise<api.IDockerConfig>;

  /**
   * Replace DockerConfig in the specified namespace
   */
  update(namespace: string, dockerCfg: api.IDockerConfig): Promise<api.IDockerConfig>;
}

export interface INamespaceApi {
  /**
   * Returns user namespaces
   */
  getNamespaces(token: string): Promise<Array<string>>;
}

export interface IDevWorkspaceApi {
  /**
   * Get the DevWorkspace with given namespace in the specified namespace
   */
  getByName(namespace: string, name: string): Promise<V1alpha2DevWorkspace>;

  /**
   * Get list of devworkspaces in the given namespace
   */
  listInNamespace(namespace: string): Promise<IDevWorkspaceList>;

  /**
   * Listen to all DevWorkspaces changes in the given namespace
   * @param namespace namespace where to listen to DevWorkspaces changes
   * @param resourceVersion special mark that all changes up to a given resourceVersion have already been sent
   * @param callbacks callback will be invoked when change happens
   */
  watchInNamespace(
    namespace: string,
    resourceVersion: string,
    callbacks: IDevWorkspaceCallbacks,
  ): Promise<{ abort: () => void }>;

  /**
   * Create a devworkspace based on the specified configuration.
   */
  create(devworkspace: V1alpha2DevWorkspace, namespace: string): Promise<V1alpha2DevWorkspace>;

  /**
   * Updates the DevWorkspace with the given configuration
   */
  update(devworkspace: V1alpha2DevWorkspace): Promise<V1alpha2DevWorkspace>;

  /**
   * Delete the DevWorkspace with given name in the specified namespace
   */
  delete(namespace: string, name: string): Promise<void>;

  /**
   * Patches the DevWorkspace with given name in the specified namespace
   */
  patch(namespace: string, name: string, patches: api.IPatch[]): Promise<V1alpha2DevWorkspace>;
}

export interface IDevWorkspaceTemplateApi {
  listInNamespace(namespace: string): Promise<V1alpha2DevWorkspaceTemplate[]>;
  getByName(namespace: string, name: string): Promise<V1alpha2DevWorkspaceTemplate>;
  patch(
    namespace: string,
    name: string,
    patches: api.IPatch[],
  ): Promise<V1alpha2DevWorkspaceTemplate>;
  delete(namespace: string, name: string): Promise<void>;
  create(template: V1alpha2DevWorkspaceTemplate): Promise<V1alpha2DevWorkspaceTemplate>;
}

export type CustomResourceDefinitionList = k8s.V1CustomResourceDefinitionList & {
  items?: CustomResourceDefinition[];
};

export type CustomResourceDefinition = k8s.V1CustomResourceDefinition & {
  spec: {
    devEnvironments?: CustomResourceDefinitionSpecDevEnvironments;
    components?: CustomResourceDefinitionSpecComponents;
  };
};

export type CustomResourceDefinitionSpecDevEnvironments = {
  containerBuildConfiguration?: {
    openShiftSecurityContextConstraint?: string;
  };
  defaultComponents?: V220DevfileComponents[];
  defaultEditor?: string;
  defaultPlugins?: api.IWorkspacesDefaultPlugins[];
  disableContainerBuildCapabilities?: boolean;
  secondsOfInactivityBeforeIdling?: number;
  secondsOfRunBeforeIdling?: number;
  storage?: {
    pvcStrategy?: string;
  };
};

export type CustomResourceDefinitionSpecComponents = {
  dashboard?: {
    headerMessage?: {
      show?: boolean;
      text?: string;
    };
  };
  devWorkspace?: {
    runningLimit?: number;
  };
  pluginRegistry?: {
    openVSXURL?: string;
  };
};

export interface IServerConfigApi {
  /**
   * Returns custom resource
   */
  fetchCheCustomResource(): Promise<CustomResourceDefinition>;
  /**
   * Returns the container build capabilities and configuration.
   */
  getContainerBuild(
    cheCustomResource: CustomResourceDefinition,
  ): Pick<
    CustomResourceDefinitionSpecDevEnvironments,
    'containerBuildConfiguration' | 'disableContainerBuildCapabilities'
  >;
  /**
   * Returns default plugins
   */
  getDefaultPlugins(cheCustomResource: CustomResourceDefinition): api.IWorkspacesDefaultPlugins[];
  /**
   * Returns the default editor to workspace create with. It could be a plugin ID or a URI.
   */
  getDefaultEditor(cheCustomResource: CustomResourceDefinition): string | undefined;
  /**
   * Returns the default components applied to DevWorkspaces.
   * These default components are meant to be used when a Devfile does not contain any components.
   */
  getDefaultComponents(cheCustomResource: CustomResourceDefinition): V220DevfileComponents[];
  /**
   * Returns the openVSX URL.
   */
  getOpenVSXURL(cheCustomResource: CustomResourceDefinition): string;
  /**
   * Returns the PVC strategy if it is defined.
   */
  getPvcStrategy(cheCustomResource: CustomResourceDefinition): string | undefined;
  /**
   * Returns a maintenance warning.
   */
  getDashboardWarning(cheCustomResource: CustomResourceDefinition): string | undefined;

  /**
   * Returns limit of running workspaces per user.
   */
  getRunningWorkspacesLimit(cheCustomResource: CustomResourceDefinition): number;

  /**
   * Returns the workspace inactivity timeout
   */
  getWorkspaceInactivityTimeout(cheCustomResource: CustomResourceDefinition): number;

  /**
   * Returns the workspace run timeout
   */
  getWorkspaceRunTimeout(cheCustomResource: CustomResourceDefinition): number;
}

export interface IKubeConfigApi {
  /**
   * Inject the kubeconfig into all containers with the given devworkspaceId in a namespace.
   */
  injectKubeConfig(namespace: string, devworkspaceId: string): Promise<void>;
}

export interface IUserProfileApi {
  /**
   * Returns user profile object that contains username and email.
   */
  getUserProfile(namespace: string): Promise<api.IUserProfile | undefined>;
}

export type IDevWorkspaceCallbacks = {
  onModified: (workspace: V1alpha2DevWorkspace) => void;
  onDeleted: (workspaceId: string) => void;
  onAdded: (workspace: V1alpha2DevWorkspace) => void;
  onError: (error: string) => void;
};

export interface IDevWorkspaceClient {
  devworkspaceApi: IDevWorkspaceApi;
  devWorkspaceTemplateApi: IDevWorkspaceTemplateApi;
  dockerConfigApi: IDockerConfigApi;
  serverConfigApi: IServerConfigApi;
  kubeConfigApi: IKubeConfigApi;
  namespaceApi: INamespaceApi;
  userProfileApi: IUserProfileApi;
}

export interface IDevWorkspaceList {
  apiVersion: string;
  kind: string;
  metadata: {
    resourceVersion?: string;
  };
  items: V1alpha2DevWorkspace[];
}

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

import { api, ClusterConfig, ClusterInfo } from '@eclipse-che/common';
import { Store } from 'redux';
import createMockStore from 'redux-mock-store';
import { AppState } from '..';
import { BrandingData } from '../../services/bootstrap/branding.constant';
import devfileApi from '../../services/devfileApi';
import { WorkspacesLogs } from '../../services/helpers/types';
import { State as BrandingState } from '../Branding';
import { DevWorkspaceResources, State as DevfileRegistriesState } from '../DevfileRegistries/index';
import { RegistryEntry } from '../DockerConfig/types';
import { ConvertedState, ResolverState, State as FactoryResolverState } from '../FactoryResolver';
import { State as InfrastructureNamespaceState } from '../InfrastructureNamespaces';
import { State as PluginsState } from '../Plugins/chePlugins';
import { State as UserProfileState } from '../UserProfile';
import { State as WorkspacesState } from '../Workspaces/index';
import mockThunk from './thunk';

export class FakeStoreBuilder {
  private state: AppState = {
    bannerAlert: {
      messages: [],
    },
    clusterConfig: {
      isLoading: false,
      clusterConfig: {
        runningWorkspacesLimit: 1,
      },
    },
    dwServerConfig: {
      isLoading: false,
      config: {
        containerBuild: {},
        defaults: {
          editor: undefined,
          components: [],
          plugins: [],
          pvcStrategy: '',
        },
        pluginRegistry: {
          openVSXURL: '',
        },
        timeouts: {
          inactivityTimeout: -1,
          runTimeout: -1,
        },
        cheNamespace: '',
      } as api.IServerConfig,
    },
    clusterInfo: {
      isLoading: false,
      clusterInfo: {
        applications: [],
      },
    },
    factoryResolver: {
      isLoading: false,
      resolver: {},
    } as FactoryResolverState,
    plugins: {
      isLoading: false,
      plugins: [],
    } as PluginsState,
    workspaces: {
      isLoading: false,
      namespace: '',
      workspaceName: '',
      workspaceUID: '',
      recentNumber: 5,
    } as WorkspacesState,
    cheWorkspaces: {
      isLoading: false,
      workspaces: [],
      workspacesLogs: new Map<string, string[]>(),
    },
    devWorkspaces: {
      isLoading: false,
      workspaces: [],
      workspacesLogs: new Map<string, string[]>(),
    },
    workspacesSettings: {
      isLoading: false,
      settings: {} as che.WorkspaceSettings,
    },
    branding: {
      isLoading: false,
      data: {},
    } as BrandingState,
    devfileRegistries: {
      isLoading: false,
      devfiles: {},
      filter: '',
      registries: {},
      devWorkspaceResources: {},
      schema: {},
    } as DevfileRegistriesState,
    userProfile: {
      isLoading: false,
      userProfile: {},
    } as UserProfileState,
    infrastructureNamespaces: {
      isLoading: false,
      namespaces: [],
    } as InfrastructureNamespaceState,
    userPreferences: {
      isLoading: false,
      preferences: {},
    },
    dwPlugins: {
      isLoading: false,
      editors: {},
      plugins: {},
      defaultPlugins: {},
    },
    dwDockerConfig: {
      isLoading: false,
      registries: [],
      error: undefined,
    },
    cheDockerConfig: {
      isLoading: false,
      registries: [],
      error: undefined,
    },
  };

  public withDwServerConfig(config: api.IServerConfig): FakeStoreBuilder {
    this.state.dwServerConfig = {
      isLoading: false,
      config,
    };
    return this;
  }

  public withBannerAlert(messages: string[]): FakeStoreBuilder {
    this.state.bannerAlert.messages = [...messages];
    return this;
  }

  public withDwDockerConfig(
    registries: RegistryEntry[],
    isLoading = false,
    error?: string,
  ): FakeStoreBuilder {
    this.state.dwDockerConfig.registries = registries;
    this.state.dwDockerConfig.isLoading = isLoading;
    this.state.dwDockerConfig.error = error;
    return this;
  }

  public withCheDockerConfig(
    registries: RegistryEntry[],
    isLoading = false,
    error?: string,
  ): FakeStoreBuilder {
    this.state.cheDockerConfig.registries = registries;
    this.state.cheDockerConfig.isLoading = isLoading;
    this.state.cheDockerConfig.error = error;
    return this;
  }

  public withUserPreferences(
    preferences: che.UserPreferences,
    isLoading = false,
  ): FakeStoreBuilder {
    this.state.userPreferences.preferences = preferences;
    this.state.userPreferences.isLoading = isLoading;
    return this;
  }

  public withClusterConfig(
    clusterConfig: Partial<ClusterConfig> | undefined,
    isLoading = false,
    error?: string,
  ): FakeStoreBuilder {
    if (clusterConfig) {
      this.state.clusterConfig.clusterConfig = Object.assign({}, clusterConfig as ClusterConfig);
    }
    this.state.clusterConfig.isLoading = isLoading;
    this.state.clusterConfig.error = error;
    return this;
  }

  public withClusterInfo(
    clusterInfo: Partial<ClusterInfo>,
    isLoading = false,
    error?: string,
  ): FakeStoreBuilder {
    this.state.clusterInfo.clusterInfo = Object.assign({}, clusterInfo as ClusterInfo);
    this.state.clusterInfo.isLoading = isLoading;
    this.state.clusterInfo.error = error;
    return this;
  }

  public withBranding(branding: BrandingData, isLoading = false, error?: string): FakeStoreBuilder {
    this.state.branding.data = Object.assign({}, branding);
    this.state.branding.isLoading = isLoading;
    this.state.branding.error = error;
    return this;
  }

  public withFactoryResolver(
    options: {
      resolver?: Partial<ResolverState>;
      converted?: Partial<ConvertedState>;
    },
    isLoading = false,
  ): FakeStoreBuilder {
    if (options.resolver) {
      this.state.factoryResolver.resolver = Object.assign({}, options.resolver as ResolverState);
    }
    if (options.converted) {
      this.state.factoryResolver.converted = Object.assign({}, options.converted as ConvertedState);
    }
    this.state.factoryResolver.isLoading = isLoading;
    return this;
  }

  public withInfrastructureNamespace(
    namespaces: che.KubernetesNamespace[],
    isLoading = false,
    error?: string,
  ): FakeStoreBuilder {
    this.state.infrastructureNamespaces.namespaces = Object.assign([], namespaces);
    this.state.infrastructureNamespaces.isLoading = isLoading;
    this.state.infrastructureNamespaces.error = error;
    return this;
  }

  public withPlugins(plugins: che.Plugin[], isLoading = false, error?: string): FakeStoreBuilder {
    this.state.plugins.plugins = Object.assign([], plugins);
    this.state.plugins.isLoading = isLoading;
    this.state.plugins.error = error;
    return this;
  }

  public withUserProfile(profile: api.IUserProfile, error?: string): FakeStoreBuilder {
    this.state.userProfile.userProfile = Object.assign({}, profile);
    this.state.userProfile.error = error;
    return this;
  }

  public withDevfileRegistries(
    options: {
      devfiles?: { [location: string]: { content?: string; error?: string } };
      registries?: { [location: string]: { metadata?: che.DevfileMetaData[]; error?: string } };
      devWorkspaceResources?: {
        [location: string]: { resources?: DevWorkspaceResources; error?: string };
      };
      schema?: any;
    },
    isLoading = false,
  ): FakeStoreBuilder {
    if (options.devfiles) {
      this.state.devfileRegistries.devfiles = Object.assign({}, options.devfiles);
    }
    if (options.registries) {
      this.state.devfileRegistries.registries = Object.assign({}, options.registries);
    }
    if (options.devWorkspaceResources) {
      this.state.devfileRegistries.devWorkspaceResources = Object.assign(
        {},
        options.devWorkspaceResources,
      );
    }
    if (options.schema) {
      this.state.devfileRegistries.schema = Object.assign({}, options.schema);
    }
    this.state.devfileRegistries.isLoading = isLoading;
    return this;
  }

  public withWorkspacesSettings(
    settings: Partial<che.WorkspaceSettings>,
    isLoading = false,
    error?: string,
  ): FakeStoreBuilder {
    this.state.workspacesSettings.settings = Object.assign({}, settings as che.WorkspaceSettings);
    this.state.workspacesSettings.isLoading = isLoading;
    this.state.workspacesSettings.error = error;
    return this;
  }

  public withCheWorkspaces(
    options: {
      workspaces?: che.Workspace[];
      workspacesLogs?: WorkspacesLogs;
    },
    isLoading = false,
    error?: string,
  ): FakeStoreBuilder {
    if (options.workspaces) {
      this.state.cheWorkspaces.workspaces = Object.assign([], options.workspaces);
    }
    if (options.workspacesLogs) {
      this.state.cheWorkspaces.workspacesLogs = new Map(options.workspacesLogs);
    }
    this.state.cheWorkspaces.isLoading = isLoading;
    this.state.cheWorkspaces.error = error;
    return this;
  }

  public withDevWorkspaces(
    options: {
      workspaces?: devfileApi.DevWorkspace[];
      workspacesLogs?: WorkspacesLogs;
    },
    isLoading = false,
    error?: string,
  ): FakeStoreBuilder {
    if (options.workspaces) {
      this.state.devWorkspaces.workspaces = Object.assign([], options.workspaces);
    }
    if (options.workspacesLogs) {
      this.state.devWorkspaces.workspacesLogs = new Map(options.workspacesLogs);
    }
    this.state.devWorkspaces.isLoading = isLoading;
    this.state.devWorkspaces.error = error;
    return this;
  }

  public withWorkspaces(
    options: {
      namespace?: string;
      workspaceName?: string;
      workspaceUID?: string;
      recentNumber?: number;
    },
    isLoading = false,
  ): FakeStoreBuilder {
    if (options.namespace) {
      this.state.workspaces.namespace = options.namespace;
    }
    if (options.workspaceName) {
      this.state.workspaces.workspaceName = options.workspaceName;
    }
    if (options.workspaceUID) {
      this.state.workspaces.workspaceUID = options.workspaceUID;
    }
    if (options.recentNumber) {
      this.state.workspaces.recentNumber = options.recentNumber;
    }
    this.state.workspaces.isLoading = isLoading;
    return this;
  }

  public withDwPlugins(
    plugins: {
      [location: string]: {
        plugin?: devfileApi.Devfile;
        url: string;
        error?: string;
      };
    },
    isLoading = false,
    defaultEditorError?: string,
  ) {
    this.state.dwPlugins.defaultEditorError = defaultEditorError;
    this.state.dwPlugins.plugins = Object.assign({}, plugins);
    this.state.dwPlugins.isLoading = isLoading;

    return this;
  }

  public build(): Store {
    const middlewares = [mockThunk];
    const mockStore = createMockStore(middlewares);
    return mockStore(this.state);
  }
}

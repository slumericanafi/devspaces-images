/*
 * Copyright (c) 2012-2022 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */
package org.eclipse.che.workspace.infrastructure.openshift.project.configurator;

import static com.google.common.base.Strings.isNullOrEmpty;

import io.fabric8.kubernetes.api.model.rbac.*;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientException;
import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import org.eclipse.che.api.workspace.server.spi.InfrastructureException;
import org.eclipse.che.api.workspace.server.spi.NamespaceResolutionContext;
import org.eclipse.che.commons.annotation.Nullable;
import org.eclipse.che.workspace.infrastructure.kubernetes.CheServerKubernetesClientFactory;
import org.eclipse.che.workspace.infrastructure.kubernetes.environment.CheInstallationLocation;
import org.eclipse.che.workspace.infrastructure.kubernetes.namespace.configurator.NamespaceConfigurator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This class creates the necessary role and rolebindings to allow the che serviceaccount to stop
 * user workspaces.
 *
 * @author Tom George
 */
@Singleton
public class OpenShiftStopWorkspaceRoleConfigurator implements NamespaceConfigurator {

  private final CheServerKubernetesClientFactory cheClientFactory;
  private final String installationLocation;
  private final boolean stopWorkspaceRoleEnabled;
  private final String oAuthIdentityProvider;

  private static final Logger LOG =
      LoggerFactory.getLogger(OpenShiftStopWorkspaceRoleConfigurator.class);

  @Inject
  public OpenShiftStopWorkspaceRoleConfigurator(
      CheServerKubernetesClientFactory cheClientFactory,
      CheInstallationLocation installationLocation,
      @Named("che.workspace.stop.role.enabled") boolean stopWorkspaceRoleEnabled,
      @Nullable @Named("che.infra.openshift.oauth_identity_provider") String oAuthIdentityProvider)
      throws InfrastructureException {
    this.cheClientFactory = cheClientFactory;
    this.installationLocation = installationLocation.getInstallationLocationNamespace();
    this.stopWorkspaceRoleEnabled = stopWorkspaceRoleEnabled;
    this.oAuthIdentityProvider = oAuthIdentityProvider;
  }

  @Override
  public void configure(NamespaceResolutionContext namespaceResolutionContext, String projectName)
      throws InfrastructureException {
    if (isNullOrEmpty(oAuthIdentityProvider)) {
      return;
    }

    try {
      if (stopWorkspaceRoleEnabled && installationLocation != null) {
        KubernetesClient client = cheClientFactory.create();
        String stopWorkspacesRoleName = "workspace-stop";

        client
            .rbac()
            .roles()
            .inNamespace(projectName)
            .createOrReplace(createStopWorkspacesRole(stopWorkspacesRoleName));

        client
            .rbac()
            .roleBindings()
            .inNamespace(projectName)
            .createOrReplace(createStopWorkspacesRoleBinding(stopWorkspacesRoleName));
      }
    } catch (KubernetesClientException e) {
      LOG.warn(
          "Stop workspace Role and RoleBinding will not be provisioned to the '{}' namespace. 'che.workspace.stop.role.enabled' property is set to '{}', {}",
          installationLocation,
          stopWorkspaceRoleEnabled,
          e.getMessage());
    }
  }

  protected Role createStopWorkspacesRole(String name) {
    return new RoleBuilder()
        .withNewMetadata()
        .withName(name)
        .endMetadata()
        .withRules(
            new PolicyRuleBuilder()
                .withApiGroups("")
                .withResources("pods")
                .withVerbs("get", "list", "watch", "delete")
                .build(),
            new PolicyRuleBuilder()
                .withApiGroups("")
                .withResources("configmaps", "services", "secrets")
                .withVerbs("delete", "list", "get")
                .build(),
            new PolicyRuleBuilder()
                .withApiGroups("route.openshift.io")
                .withResources("routes")
                .withVerbs("delete", "list")
                .build(),
            new PolicyRuleBuilder()
                .withApiGroups("apps")
                .withResources("deployments", "replicasets")
                .withVerbs("delete", "list", "get", "patch")
                .build())
        .build();
  }

  protected RoleBinding createStopWorkspacesRoleBinding(String name) {
    return new RoleBindingBuilder()
        .withNewMetadata()
        .withName(name)
        .endMetadata()
        .withNewRoleRef()
        .withKind("Role")
        .withName(name)
        .endRoleRef()
        .withSubjects(
            new SubjectBuilder()
                .withKind("ServiceAccount")
                .withName("che")
                .withNamespace(installationLocation)
                .build())
        .build();
  }
}

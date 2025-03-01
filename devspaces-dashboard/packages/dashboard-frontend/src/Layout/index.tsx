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

import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Page } from '@patternfly/react-core';
import { History } from 'history';
import { matchPath } from 'react-router';

import Header from './Header';
import Sidebar from './Sidebar';
import PreloadIssuesAlert from './PreloadIssuesAlert';
import { ThemeVariant } from './themeVariant';
import { AppState } from '../store';
import { lazyInject } from '../inversify.config';
import { IssuesReporterService } from '../services/bootstrap/issuesReporter';
import { ErrorReporter } from './ErrorReporter';
import { IssueComponent } from './ErrorReporter/Issue';
import { BannerAlert } from '../components/BannerAlert';
import { ErrorBoundary } from './ErrorBoundary';
import { DisposableCollection } from '../services/helpers/disposable';
import { ROUTE } from '../Routes/routes';
import { selectBranding } from '../store/Branding/selectors';
import { ToggleBarsContext } from '../contexts/ToggleBars';
import { signOut } from '../services/helpers/login';

const THEME_KEY = 'theme';
const IS_MANAGED_SIDEBAR = false;

type Props = MappedProps & {
  children: React.ReactNode;
  history: History;
};
type State = {
  isSidebarVisible: boolean;
  isHeaderVisible: boolean;
  theme: ThemeVariant;
};

export class Layout extends React.PureComponent<Props, State> {
  @lazyInject(IssuesReporterService)
  private readonly issuesReporterService: IssuesReporterService;

  private readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    const theme: ThemeVariant =
      (window.sessionStorage.getItem(THEME_KEY) as ThemeVariant) || ThemeVariant.DARK;

    this.state = {
      isHeaderVisible: true,
      isSidebarVisible: true,
      theme,
    };
  }

  private toggleNav(): void {
    this.setState({
      isSidebarVisible: !this.state.isSidebarVisible,
    });
    window.postMessage('toggle-navbar', '*');
  }

  private changeTheme(theme: ThemeVariant): void {
    this.setState({ theme });
    window.sessionStorage.setItem(THEME_KEY, theme);
  }

  /**
   * Returns `true` if current location matches the IDE page path.
   */
  private testIdePath(): boolean {
    const currentPath = this.props.history.location.pathname;
    const match = matchPath(currentPath, {
      path: ROUTE.IDE_LOADER,
      exact: true,
      strict: false,
    });
    return match !== null;
  }

  private hideAllBars(): void {
    this.setState({
      isHeaderVisible: false,
      isSidebarVisible: false,
    });
  }

  private showAllBars(): void {
    this.setState({
      isHeaderVisible: true,
      isSidebarVisible: true,
    });
  }

  public componentDidMount(): void {
    const matchFactoryLoaderPath = matchPath(this.props.history.location.pathname, {
      path: ROUTE.FACTORY_LOADER,
    });
    const matchIdeLoaderPath = matchPath(this.props.history.location.pathname, {
      path: ROUTE.IDE_LOADER,
    });
    if (matchFactoryLoaderPath !== null || matchIdeLoaderPath !== null) {
      this.hideAllBars();
    }

    this.listenToIframeMessages();
  }

  public componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  private listenToIframeMessages() {
    const handleMessage = (event: MessageEvent): void => {
      if (typeof event.data !== 'string') {
        return;
      }

      if (event.data === 'show-navbar') {
        this.setState({
          isSidebarVisible: true,
          isHeaderVisible: true,
        });
      } else if (event.data === 'hide-navbar') {
        const isHeaderVisible =
          !this.testIdePath() || document.getElementById('ide-iframe') === null;
        this.setState({
          isSidebarVisible: false,
          isHeaderVisible,
        });
      } else if (event.data === 'hide-allbar') {
        this.setState({
          isSidebarVisible: false,
          isHeaderVisible: false,
        });
      }
    };
    window.addEventListener('message', handleMessage, false);
    this.toDispose.push({
      dispose: () => {
        window.removeEventListener('message', handleMessage);
      },
    });
  }

  public render(): React.ReactElement {
    /* check for startup issues */
    if (this.issuesReporterService.hasIssue) {
      const issue = this.issuesReporterService.reportIssue();
      const brandingData = this.props.branding;
      if (issue) {
        return (
          <ErrorReporter>
            <IssueComponent branding={brandingData} issue={issue} />
          </ErrorReporter>
        );
      }
    }

    const { isHeaderVisible, isSidebarVisible, theme } = this.state;
    const { history } = this.props;

    const logoUrl = this.props.branding.logoFile;

    return (
      <ToggleBarsContext.Provider
        value={{
          hideAll: () => this.hideAllBars(),
          showAll: () => this.showAllBars(),
        }}
      >
        <Page
          header={
            <Header
              history={history}
              isVisible={isHeaderVisible}
              logoUrl={logoUrl}
              logout={() => signOut()}
              toggleNav={() => this.toggleNav()}
              changeTheme={theme => this.changeTheme(theme)}
            />
          }
          sidebar={
            <Sidebar
              isManaged={IS_MANAGED_SIDEBAR}
              isNavOpen={isSidebarVisible}
              history={history}
              theme={theme}
            />
          }
          isManagedSidebar={IS_MANAGED_SIDEBAR}
        >
          <ErrorBoundary>
            <PreloadIssuesAlert />
            <BannerAlert />
            {this.props.children}
          </ErrorBoundary>
        </Page>
      </ToggleBarsContext.Provider>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  branding: selectBranding(state),
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(Layout);

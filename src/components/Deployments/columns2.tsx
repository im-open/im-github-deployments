import React from 'react';
import { EnvDeployment } from '../../api/types';
// import { Box, Typography } from '@material-ui/core';
import {
  //   StatusPending,
  //   StatusRunning,
  //   StatusOK,
  TableColumn,
  //   StatusAborted,
  //   StatusError,
  //   Link,
} from '@backstage/core-components';
import CheckIcon from '@material-ui/icons/Check';
// import { DateTime } from 'ts-luxon';

/** @public */
export const columnFactories = Object.freeze({
  createCurrentColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Current',
      field: 'current',
      render: (row: EnvDeployment) =>
        row.state.toLowerCase() === 'success' ? <CheckIcon /> : <></>,
    };
  },
  createEnvironmentColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Environment',
      field: 'environment',
    };
  },
  createRefColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Tag/Ref',
      field: 'ref',
    };
  },
  createInstanceColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Instance',
      field: 'payload.instance',
    };
  },
  createStatusColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Status',
      field: 'state',
    };
  },
  createCreatedAtColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Deployed',
      field: 'created_at',
      render: (row: EnvDeployment) => row.created_at.toLocaleString(),
    };
  },
  createUserColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'User',
      field: 'payload.workflow_actor',
      render: (row: EnvDeployment) =>
        row.payload.workflow_actor ?? row.deployed_by,
    };
  },
});

/** @public */
export const defaultDeploymentColumns: TableColumn<EnvDeployment>[] = [
  columnFactories.createCurrentColumn(),
  columnFactories.createEnvironmentColumn(),
  columnFactories.createRefColumn(),
  columnFactories.createInstanceColumn(),
  columnFactories.createStatusColumn(),
  columnFactories.createCreatedAtColumn(),
  columnFactories.createUserColumn(),
];

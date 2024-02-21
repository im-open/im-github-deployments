import React, { useState, useEffect } from 'react';
import { EnvDeployment } from '../../api/types';
import { TableContainer, Typography, makeStyles } from '@material-ui/core';
import { Table } from '@backstage/core-components';
import { defaultDeploymentColumns } from './columns';
import GitHubIcon from '@material-ui/icons/GitHub';

const useStyles = makeStyles(theme => ({
  empty: {
    padding: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
  },
}));

/** @public */
export const EnvironmentDeployments = (props: {
  environment: string;
  loading: boolean;
  currentDeployments: EnvDeployment[];
  projectSlug: string;
}) => {
  const [currentDeployments, setCurrentDeployments] = useState<EnvDeployment[]>(
    [],
  );
  const classes = useStyles();

  useEffect(() => {
    if (!props.loading) {
      setCurrentDeployments(props.currentDeployments);
    }
  }, [props.loading, props.currentDeployments]);

  currentDeployments.sort((a, b) => (a.id < b.id ? 1 : -1));
  const display = (
    <TableContainer>
      <Table
        title={
          `Environment Deployments` +
          (props.environment.toLowerCase() == 'any'
            ? ''
            : ': ' + props.environment)
        }
        columns={defaultDeploymentColumns}
        options={{
          header: true,
          padding: 'dense',
          paging: true,
          pageSize: 10,
          search: false,
          showEmptyDataSourceMessage: true,
          toolbar: true,
          tableLayout: 'auto',
        }}
        data={currentDeployments}
        isLoading={props.loading}
        emptyContent={
          <div className={classes.empty}>
            <Typography variant="body1">
              No deployments for <code>{props.projectSlug}</code> in{' '}
              <code>{props.environment}</code> environment.
            </Typography>
          </div>
        }
        actions={[
          {
            icon: () => <GitHubIcon />,
            tooltip: 'Environment Deployments',
            isFreeAction: true,
            disabled: props.loading || props.environment.toLowerCase() == 'any',
            onClick: () => {
              window.open(
                `https://github.com/${props.projectSlug}/deployments/${props.environment}`,
                '_blank',
              );
            },
          },
        ]}
      />
    </TableContainer>
  );

  return <>{display}</>;
};

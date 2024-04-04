import React, { useState, useEffect } from 'react';
import { EnvDeployment } from '../../api/types';
import { Table } from '@backstage/core-components';
import { deploymentsColumns } from './columns2';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { alpha, useTheme } from '@mui/material/styles';
import SyncIcon from '@material-ui/icons/Sync';

/** @public */
export const Deployments2 = (props: {
  loading: boolean;
  deployments: EnvDeployment[];
  projectSlug: string;
  reloadDashboard: () => void;
  catalogEnvironments: string[];
}) => {
  // const { reloadDashboard } = props;
  const [deployments, setDeployments] = useState<EnvDeployment[]>([]);
  const [catalogEnvironments, setCatalogEnvironments] = useState<string[]>([]);
  const [displayFiltering, setDisplayFiltering] = useState<boolean>(false);
  const theme = useTheme();

  useEffect(() => {
    if (!props.loading) {
      setDeployments(props.deployments);
      setCatalogEnvironments(props.catalogEnvironments);
    }
  }, [props.loading, props.deployments]);

  const columns = deploymentsColumns(catalogEnvironments);

  return (
    <Table<EnvDeployment>
      isLoading={props.loading}
      columns={columns}
      options={{
        paging: true,
        pageSize: 20,
        actionsColumnIndex: -1,
        loadingType: 'linear',
        showEmptyDataSourceMessage: !props.loading,
        padding: 'dense',
        pageSizeOptions: [20, 50, 100],
        filtering: displayFiltering,
        search: displayFiltering,
        rowStyle: row =>
          !row.current
            ? {}
            : {
                backgroundColor: alpha(theme.palette.primary.light, 0.4),
              },
      }}
      title={`GitHub Deployments (${deployments.length})`}
      data={deployments}
      emptyContent={
        <div
          style={{
            width: '100%',
            height: '50px',
            textAlign: 'center',
            verticalAlign: 'middle',
          }}
        >
          <h2 style={{ marginTop: '20px', marginBottom: '20px' }}>
            No deployments for <code>{props.projectSlug}</code>
          </h2>
          <br />
          <br />
        </div>
      }
      actions={[
        {
          icon: () =>
            displayFiltering ? <FilterAltOffIcon /> : <FilterAltIcon />,
          tooltip: `Toggle Filter ${displayFiltering ? 'Off' : 'On'}`,
          isFreeAction: true,
          onClick: () => setDisplayFiltering(!displayFiltering),
        },
        {
          icon: SyncIcon,
          tooltip: 'Reload GitHubs Deployment Data',
          isFreeAction: true,
          onClick: () => props.reloadDashboard(),
        },
      ]}
    />
  );
};

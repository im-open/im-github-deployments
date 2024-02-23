import React, { useState, useEffect } from 'react';
import { EnvDeployment } from '../../api/types';
import { InfoCard } from '@backstage/core-components';
import { Button, Grid } from '@material-ui/core';
import { DataGrid, gridClasses } from '@mui/x-data-grid';
import { alpha, styled } from '@mui/material/styles';
import { columns } from './columns';
import SyncIcon from '@material-ui/icons/Sync';

/** @public */
export const Deployments = (props: {
  loading: boolean;
  deployments: EnvDeployment[];
  projectSlug: string;
  reloadDashboard: () => void;
}) => {
  const { reloadDashboard } = props;
  const [deployments, setDeployments] = useState<EnvDeployment[]>([]);

  useEffect(() => {
    if (!props.loading) {
      setDeployments(props.deployments);
    }
  }, [props.loading, props.deployments]);

  const StyledGrid = styled(DataGrid)(({ theme }) => ({
    [`& .${gridClasses.row}.current`]: {
      backgroundColor: alpha(theme.palette.primary.light, 0.4),
    },
  })) as typeof DataGrid;

  const display = (
    <InfoCard
      title="Deployments"
      action={
        <Button
          onClick={() => reloadDashboard()}
          variant="outlined"
          size="small"
        >
          <SyncIcon />
        </Button>
      }
    >
      <Grid item sm={12} md={12} lg={12}>
        <Grid container spacing={3} alignItems="stretch">
          <Grid item sm={12} md={12} lg={12}>
            <Grid container spacing={3} alignItems="stretch">
              <StyledGrid
                loading={props.loading}
                rows={deployments}
                columns={columns}
                disableRowSelectionOnClick={true}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 100]}
                getRowClassName={params =>
                  params.row.state.toLowerCase() == 'success' ? 'current' : ''
                }
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </InfoCard>
  );

  return <>{display}</>;
};

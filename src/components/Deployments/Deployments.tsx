import React, { useState, useEffect /*, useRef*/ } from 'react';
import { EnvDeployment } from '../../api/types';
import { InfoCard } from '@backstage/core-components';
import { Button, Grid /*, Portal*/ } from '@material-ui/core';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  gridClasses,
} from '@mui/x-data-grid';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { columns, columnHeaderClass } from './columns';
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
  const theme = useTheme();

  useEffect(() => {
    if (!props.loading) {
      setDeployments(props.deployments);
    }
  }, [props.loading, props.deployments]);

  const deploymentsToolbar = (props: any) => (
    <GridToolbarContainer {...props} sx={{ width: '100%', display: 'inline' }}>
      <div style={{ width: '50%', float: 'left' }}>
        <GridToolbarColumnsButton
          style={{
            color: theme.palette.mode === 'dark' ? 'white' : 'primary',
          }}
        />
        <GridToolbarFilterButton
          style={{
            color: theme.palette.mode === 'dark' ? 'white' : 'primary',
          }}
        />
      </div>
      <div style={{ float: 'right', width: '50%', textAlign: 'right' }}>
        <GridToolbarQuickFilter />
      </div>
    </GridToolbarContainer>
  );

  const StyledGrid = styled(DataGrid)(({ theme }) => ({
    [`& .${columnHeaderClass}`]: {
      borderTop: theme.palette.mode === 'dark' ? `2px solid white` : 'none',
      borderBottom: theme.palette.mode === 'dark' ? `2px solid white` : 'none',
    },
    [`& .${gridClasses.row}.current`]: {
      backgroundColor: alpha(theme.palette.primary.light, 0.4),
    },
  })) as typeof DataGrid;

  const displayDeploymentsTitle = `GitHub Deployments (${deployments.length})`;
  const display = (
    <InfoCard
      title={displayDeploymentsTitle}
      action={
        <Button
          onClick={() => reloadDashboard()}
          variant="outlined"
          size="small"
          style={{
            float: 'right',
          }}
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
                sx={{
                  boxShadow: 0,
                  border: 0,
                  padding: 0,
                  margin: 0,
                }}
                loading={props.loading}
                rows={deployments}
                columns={columns}
                disableRowSelectionOnClick={true}
                rowSelection={false}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 25 },
                  },
                }}
                getRowClassName={params =>
                  params.row.state.toLowerCase() == 'success' ? 'current' : ''
                }
                slots={{
                  toolbar: deploymentsToolbar,
                }}
                slotProps={{
                  toolbar: { showQuickFilter: true },
                }}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </InfoCard>
  );

  return <>{display}</>;
};

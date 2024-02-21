import React from 'react';
import {
  Button,
  Card,
  CardContent,
  Tooltip,
  useTheme,
} from '@material-ui/core';
import { EnvState } from '../../api/types';

export const EnvironmentDeploymentCard = (props: { envState: EnvState }) => {
  const { envState } = props;
  const theme = useTheme();

  return (
    <Card
      variant="elevation"
      style={{ backgroundColor: theme.palette.info.light }}
    >
      <CardContent>
        <h3>Instance: {envState.instance}</h3>
        <p>
          Tag: <code>{envState.ref}</code>
        </p>
        <p>Status: {envState.status}</p>
        <p>
          <Tooltip
            title={envState.created_at.toLocaleString()}
            style={{
              padding: 0,
            }}
          >
            <Button>
              Created: <em>{envState.createdHuman}</em>
            </Button>
          </Tooltip>
        </p>
      </CardContent>
    </Card>
  );
};

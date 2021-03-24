import React from 'react';
import { useHistory } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';

export default function NoMatch() {
  const history = useHistory();
  return (
    <div
      style={{
        padding: '2rem',
      }}
    >
      <Paper square style={{ textAlign: 'center', padding: '0.5rem 0 2rem' }}>
        <Typography variant="h6" style={{ padding: '1rem 0 0' }}>
          ERROR - Page not found
        </Typography>
        <Typography variant="body1" style={{ padding: '1rem 0 2rem' }}>
          URL appears to be invalid. Please check the link again.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => history.goBack()}
        >
          Go Back
        </Button>
      </Paper>
    </div>
  );
}

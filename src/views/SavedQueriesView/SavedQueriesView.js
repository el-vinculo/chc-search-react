import React, { useEffect, useState } from 'react';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import { useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import _isEmpty from 'lodash/isEmpty';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TableRow from '@material-ui/core/TableRow';
import Button from '@material-ui/core/Button';
import VisibilityIcon from '@material-ui/icons/Visibility';
import DeleteIcon from '@material-ui/icons/Delete';

import { API } from '../../config';
import { httpRequest } from '../../utils';
import {
  isLoadingState,
  notificationAlertState,
  viewerSessionState,
  queryToLoadState,
} from '../../state';
import './SavedQueriesView.scss';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  container: {
    maxHeight: 'calc(100vw - 102px)',
  },
  title: {
    color: theme.palette.primary.main,
    marginBottom: '1rem',
    fontSize: '1.4rem',
    fontWeight: 400,
  },
  tableHeadCell: {
    fontWeight: 'bold',
  },
}));

const COLUMNS_CONFIG = [
  { id: 'query_name', label: 'Query Name' },
  {
    id: 'query_hash',
    label: 'Keywords',
    format: (value) => {
      const keywordsArr = [];
      Object.keys(value).forEach((k) => {
        if (Array.isArray(value[k])) {
          value[k].forEach((val) => {
            keywordsArr.push(val.value);
          });
        }
      });
      return keywordsArr.join(', ');
    },
  },
  {
    id: 'global',
    label: 'Saved Globally?',
    format: (value) => (value ? 'YES' : 'NO'),
  },
  {
    id: 'created_at',
    label: 'Created On',
    format: (value) =>
      value ? new Date(value).toLocaleDateString('en-US') : 'N/A',
  },
  {
    id: 'actions',
    label: 'Actions',
    styles: {
      width: 250,
    },
  },
];

const ROWS_PER_PAGE = 10;

export default function SavedQueriesView() {
  const classes = useStyles();
  const history = useHistory();

  const setLoading = useSetRecoilState(isLoadingState);
  const setNotificationAlert = useSetRecoilState(notificationAlertState);
  const viewerSession = useRecoilValue(viewerSessionState);
  const setQueryToLoad = useSetRecoilState(queryToLoadState);

  const [savedQueries, setSavedQueries] = useState([]);
  const [page, setPage] = useState(0);
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);
  const [queryToDelete, setQuertToDelete] = useState();

  useEffect(() => {
    const fetchSavedQueries = async () => {
      if (_isEmpty(viewerSession)) {
        setNotificationAlert({
          type: 'error',
          msg: 'Please login and try again',
        });
        return;
      }
      try {
        setLoading(true);
        const response = await httpRequest({
          method: 'post',
          endpoint: API.FETCH_SAVED_QUERIES,
          data: {
            email: viewerSession.email,
          },
        });
        setLoading(false);
        setSavedQueries(response.data.favorite_queries);
      } catch (err) {
        console.error('Error calling API', err);
        setNotificationAlert({
          type: 'error',
          msg: 'Error fetching saved queries',
        });
        setLoading(false);
      }
    };

    fetchSavedQueries();
  }, [setLoading, setNotificationAlert, viewerSession]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleQueryDeletion = async (savedQuery) => {
    if (_isEmpty(viewerSession)) {
      setNotificationAlert({
        type: 'error',
        msg: 'Please login and try again',
      });
      return;
    }
    setOpenDeleteConfirmation(false);
    try {
      setLoading(true);
      await httpRequest({
        method: 'post',
        endpoint: API.DELETE_SAVED_QUERY,
        data: {
          email: viewerSession.email,
          query_id: savedQuery.id,
        },
      });
      setLoading(false);
      setNotificationAlert({
        type: 'success',
        msg: 'Query deleted successfully',
      });
      const updatedSavedQueries = [...savedQueries];
      updatedSavedQueries.splice(updatedSavedQueries.indexOf(savedQuery), 1);
      setSavedQueries(updatedSavedQueries);
    } catch (err) {
      console.error('Error calling API', err);
      setNotificationAlert({
        type: 'error',
        msg: 'Error deleting saved query',
      });
      setLoading(false);
    }
  };

  const handleDeleteConfirmationClose = () => {
    setQuertToDelete();
    setOpenDeleteConfirmation(false);
  };

  return (
    <div className="saved-queries-container">
      <Typography variant="h3" className={classes.title}>
        Saved Queries
      </Typography>
      <Paper className={classes.root}>
        <TableContainer className={classes.container}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                {COLUMNS_CONFIG.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={column.styles}
                    className={classes.tableHeadCell}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {savedQueries
                .slice(
                  page * ROWS_PER_PAGE,
                  page * ROWS_PER_PAGE + ROWS_PER_PAGE,
                )
                .map((row) => (
                  <TableRow hover tabIndex={-1} key={row.id}>
                    {COLUMNS_CONFIG.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.id !== 'actions' && column.format
                            ? column.format(value)
                            : value}
                          {column.id === 'actions' && (
                            <div className="actions-wrap">
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                  setQueryToLoad(row);
                                  history.push('/');
                                }}
                                startIcon={<VisibilityIcon />}
                              >
                                View
                              </Button>
                              <Button
                                variant="outlined"
                                color="secondary"
                                onClick={() => {
                                  setQuertToDelete(row);
                                  setOpenDeleteConfirmation(true);
                                }}
                                startIcon={<DeleteIcon />}
                                style={{
                                  marginLeft: '0.5rem',
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10]}
          component="div"
          count={savedQueries.length}
          rowsPerPage={ROWS_PER_PAGE}
          page={page}
          onChangePage={handleChangePage}
        />
      </Paper>
      <Dialog
        open={openDeleteConfirmation}
        onClose={handleDeleteConfirmationClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this query?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteConfirmationClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => handleQueryDeletion(queryToDelete)}
            color="primary"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

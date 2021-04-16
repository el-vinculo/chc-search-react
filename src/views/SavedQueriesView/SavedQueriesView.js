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
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import TableRow from '@material-ui/core/TableRow';
import Button from '@material-ui/core/Button';
import VisibilityIcon from '@material-ui/icons/Visibility';
import DeleteIcon from '@material-ui/icons/Delete';
import SearchIcon from '@material-ui/icons/Search';

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
    type: 'date',
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
  const [queryToDelete, setQueryToDelete] = useState();
  const [selectedRows, setSelectedRows] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('created_at');

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

  const handleQueryDeletion = async (savedQueryIds) => {
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
          query_id: savedQueryIds,
        },
      });
      setLoading(false);
      setNotificationAlert({
        type: 'success',
        msg: `${
          savedQueryIds.length > 1 ? 'Queries' : 'Query'
        } deleted successfully`,
      });
      const updatedSavedQueries = savedQueries.filter(
        (sq) => !savedQueryIds.includes(sq.id),
      );
      // const updatedSavedQueries = [...savedQueries];
      // updatedSavedQueries.splice(updatedSavedQueries.indexOf(savedQuery), 1);
      setSavedQueries(updatedSavedQueries);
      setSelectedRows([]);
      setQueryToDelete();
    } catch (err) {
      console.error('Error calling API', err);
      setNotificationAlert({
        type: 'error',
        msg: `Error deleting saved ${
          savedQueryIds.length > 1 ? 'Queries' : 'Query'
        }`,
      });
      setLoading(false);
    }
  };

  const handleDeleteConfirmationClose = () => {
    setQueryToDelete();
    setOpenDeleteConfirmation(false);
  };

  const handleSelectAllClick = (event, queries) => {
    if (event.target.checked) {
      const newSelecteds = queries.map((n) => n.id);
      setSelectedRows(newSelecteds);
      return;
    }
    setSelectedRows([]);
  };

  const handleRowClick = (event, id) => {
    const selectedIndex = selectedRows.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedRows, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedRows.slice(1));
    } else if (selectedIndex === selectedRows.length - 1) {
      newSelected = newSelected.concat(selectedRows.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedRows.slice(0, selectedIndex),
        selectedRows.slice(selectedIndex + 1),
      );
    }

    setSelectedRows(newSelected);
  };

  const isRowSelected = (id) => selectedRows.indexOf(id) !== -1;

  function descendingComparator(a, b, orderByVal) {
    const columnConfig = COLUMNS_CONFIG.find((c) => c.id === orderByVal);
    let val1 = a[orderByVal];
    let val2 = b[orderByVal];
    if (columnConfig.type && columnConfig.type.toLowerCase() === 'date') {
      val1 = new Date(val1);
      val2 = new Date(val2);
    }
    if (val2 < val1) {
      return -1;
    }
    if (val2 > val1) {
      return 1;
    }
    return 0;
  }

  function getComparator(orderVal, orderByVal) {
    return orderVal === 'desc'
      ? (a, b) => descendingComparator(a, b, orderByVal)
      : (a, b) => -descendingComparator(a, b, orderByVal);
  }

  function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const orderVal = comparator(a[0], b[0]);
      if (order !== 0) return orderVal;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  const createSortHandler = (property) => (event) => {
    handleRequestSort(event, property);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredQueries = savedQueries
    ? savedQueries.filter(
        (sq) =>
          sq.query_name &&
          sq.query_name.toLowerCase().includes(filterText.toLowerCase()),
      )
    : [];

  return (
    <div className="saved-queries-container">
      <div className="title-wrap">
        <Typography variant="h3" className={classes.title}>
          Saved Queries
        </Typography>
        <div className="table-meta">
          <TextField
            label="Filter by Query Name"
            id="query-name-filter"
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setPage(0);
              setSelectedRows([]);
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            variant="outlined"
            size="small"
          />
          <Button
            // onClick={() => handleQueryDeletion(selectedRows)}
            onClick={() => setOpenDeleteConfirmation(true)}
            color="secondary"
            variant={selectedRows.length === 0 ? 'outlined' : 'contained'}
            startIcon={<DeleteIcon />}
            disabled={selectedRows.length === 0}
          >
            Delete Selected{' '}
            {selectedRows.length > 0 ? `(${selectedRows.length})` : ''}
          </Button>
        </div>
      </div>
      <Paper className={classes.root}>
        <TableContainer className={classes.container}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedRows.length > 0 &&
                      selectedRows.length < filteredQueries.length
                    }
                    checked={
                      filteredQueries.length > 0 &&
                      selectedRows.length === filteredQueries.length
                    }
                    onChange={(e) => handleSelectAllClick(e, filteredQueries)}
                  />
                </TableCell>
                {COLUMNS_CONFIG.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={column.styles}
                    className={classes.tableHeadCell}
                    sortDirection={orderBy === column.id ? order : false}
                  >
                    {column.id === 'created_at' ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={createSortHandler(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {stableSort(filteredQueries, getComparator(order, orderBy))
                .slice(
                  page * ROWS_PER_PAGE,
                  page * ROWS_PER_PAGE + ROWS_PER_PAGE,
                )
                .map((row) => (
                  <TableRow
                    hover
                    tabIndex={-1}
                    key={row.id}
                    onClick={(e) => handleRowClick(e, row.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={isRowSelected(row.id)} />
                    </TableCell>
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
                                  setQueryToDelete(row);
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
          count={filteredQueries.length}
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
            Are you sure you want to delete selected record(s)?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteConfirmationClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() =>
              handleQueryDeletion(
                queryToDelete ? [queryToDelete.id] : selectedRows,
              )
            }
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

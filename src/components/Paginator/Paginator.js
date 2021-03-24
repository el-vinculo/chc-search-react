import React from 'react';
import PropTypes from 'prop-types';
import _get from 'lodash/get';
import Pagination from '@material-ui/lab/Pagination';
import './Paginator.scss';

function Paginator({ sourceData, countPerPage, currentPage, changePage }) {
  const handleChangePage = (event, newPage) => {
    changePage(newPage);
  };

  return (
    <div className="paginator-wrap">
      <Pagination
        className={
          _get(sourceData, 'length', 0) > 0 ? 'paginationLG' : 'hidden'
        }
        count={Math.ceil(_get(sourceData, 'length', 0) / countPerPage)}
        page={currentPage}
        onChange={handleChangePage}
        shape="rounded"
        color="primary"
        size="large"
      />
      <Pagination
        className={
          _get(sourceData, 'length', 0) > 0 ? 'paginationSM' : 'hidden'
        }
        siblingCount={0}
        boundaryCount={1}
        count={Math.ceil(_get(sourceData, 'length', 0) / countPerPage)}
        page={currentPage}
        onChange={handleChangePage}
        shape="rounded"
        color="primary"
        size="small"
      />
    </div>
  );
}

Paginator.propTypes = {
  sourceData: PropTypes.array,
  countPerPage: PropTypes.number,
  currentPage: PropTypes.number,
  changePage: PropTypes.func,
};

export default Paginator;

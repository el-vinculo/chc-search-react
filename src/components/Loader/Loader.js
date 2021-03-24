import React, { memo } from 'react';
import SPINNER from '../../assets/spinner.svg';
import './Loader.scss';

function Loader() {
  return (
    <div className="loading-container">
      <div className="loader">
        <img src={SPINNER} alt="Loader..." />
      </div>
    </div>
  );
}

export default memo(Loader);

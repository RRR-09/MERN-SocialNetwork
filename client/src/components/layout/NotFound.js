import React, { Fragment } from 'react';

const NotFound = () => {
  return (
    <Fragment>
      <h1 className='x-large text-primary'>
        <i className='fas fa-exclamation-triangle'></i> Page Not Found
      </h1>
      <h3>Sorry, we can't find the page you were looking for.</h3>
    </Fragment>
  );
};
export default NotFound;

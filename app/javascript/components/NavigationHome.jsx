import React from 'react';
// import logo from './logo.png';

const Navigation = () => {
  return (
    <div class="d-flex flex-column flex-md-row align-items-center p-3 px-md-4 mb-3">
    <h5 class="my-0 mr-md-auto font-weight-normal">kdpmfss Logo</h5>
    <nav id="navlinks" class="my-2 my-md-0 mr-md-4">
      <a class="p-2 text-white px-4" href="#">Find Jobs</a>
      <a class="p-2 text-white" href="#">Post a Job</a>
    </nav>
    <a id="login" class="btn btn-outline-primary mr-3" href="#">Login</a>
    <a id="signup" class="btn btn-primary" href="#">Sign up</a>
  </div>
  );
};


export default Navigation;
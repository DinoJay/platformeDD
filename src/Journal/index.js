// import React from 'react';
import { connect } from 'react-redux';
// import { toggleChallenge } from '../actions';
import { screenResize, processData, filterTime } from './actions';

import Journal from './Journal';

// import mapViewReducer from './reducer';

// Container
const mapStateToProps = state => ({
  ...state
});

const mapDispatchToProps = dispatch => ({
  screenResize: payload => {
    dispatch(screenResize(payload));
  },
  processData: payload => {
    dispatch(processData(payload));
  },
  filterTime: payload => {
    dispatch(filterTime(payload));
  }
});

const JournalCont = connect(mapStateToProps, mapDispatchToProps)(Journal);

export default JournalCont;

import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import _ from 'lodash';
import * as d3 from 'd3';

// import debug from 'debug';

import reducer from './Journal/reducer';

import Journal from './Journal';
import rawData from './diigo.json';
// import NotFound from './containers/NotFound/NotFound';

function setify(data, id = null) {
  return d3
    .nest()
    .key(d => d.key)
    .entries(
      _.flattenDeep(
        data.map(d =>
          d.tags.map(t => {
            d.key = t;
            return d;
          })
        )
      )
    )
    .map(d => {
      d.count = d.values.length;
      d.id = `${d.key} ${id}`;
      return d;
    })
    .sort((a, b) => b.count - a.count);
}

function chunkArray(myArray, chunkSize) {
  let index = 0;
  const arrayLength = myArray.length;
  const tempArray = [];
  let myChunk;

  for (index = 0; index < arrayLength; index += chunkSize) {
    myChunk = myArray.slice(index, index + chunkSize);
    // Do something if you want with the group
    tempArray.push(myChunk);
  }

  return tempArray;
}

function prepareData() {
  const parseTime = d3.timeParse('%Y/%m/%d %H:%M:%S %Z');
  return rawData.map(d => {
    if (typeof d.tags === 'string' || d.tags instanceof String) {
      d.tags = d.tags.split(',');
    } else {
      d.tags = [];
    }
    d.count = d.tags.length;
    d.date = parseTime(d.created_at);
    return d;
  });
}

const data = prepareData().slice(0, 200);
const tagMapData = data.slice(0, 1000);
const timelineData = d3
  .nest()
  .key(d => d3.timeMonth(d.date))
  .entries(data)
  .map((d, i) => {
    d.minDate = d3.min(d.values, e => e.date);
    d.maxDate = d3.max(d.values, e => e.date);
    d.id = `${d.minDate} + ${d.maxDate} ${i}`;
    d.sets = setify(d.values, d.id).filter(e => e.values.length > 2);
    return d;
  })
  .sort((a, b) => a.minDate - b.minDate);

const sets = setify(data).filter(d => d.values.length > 2);
const setKeys = sets.map(d => d.key);

// const setKeys = sets.map(d => d.key).slice(0, 10);
// console.log('setKeys: ', setKeys);
//
// data.forEach(d => {
//   d.tags = _.intersection(d.tags, setKeys);
//   return d;
// });
// console.log('nd: ', nd);

const tagMapSets = sets.filter(d => d.values.length > 4);

data.forEach((d, i) => {
  const overlap = _.intersection(d.tags, setKeys.slice(0, 1000));
  d.tags = overlap.length === 0 ? ['other'] : overlap;
  d.id = i;
});

// debug('lego:routes');
const defaultState = {
  // rawData,
  data,
  sets,
  // tagMapConf: {
  tagMapWidth: 800,
  tagMapHeight: 800,
  tagMapData,
  tagMapSets,
  // },
  // timelineConf: {
  timelineWidth: 800,
  timelineHeight: 800,
  timelineData,
  // },
  // tagCloudConf: {
  tagCloudWidth: 800,
  tagCloudHeight: 800,
  width: 1000,
  height: 1000
  // sets: [],
  // tagMapData: []
  // }
};

const store = createStore(reducer, defaultState);

const App = () => (
  <Provider store={store}>
    <Journal />
  </Provider>
);

export default App;

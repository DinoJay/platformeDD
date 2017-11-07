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

function setify(data) {
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
      // d.tags = i % 2 ? ['hallo'] : ['test'];
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

const data = prepareData().slice(0, 1000);
const tagMapData = data.slice(0, 1000);
const nestByTime = (docs, d3time = d3.timeMonth, minSetSize = 2, maxVal = 8) =>
  d3
    .nest()
    .key(d => d3time(d.date))
    .entries(docs)
    .map((d, i) => {
      d.id = i;
      d.minDate = d3.min(d.values, e => e.date);
      d.maxDate = d3.max(d.values, e => e.date);
      d.sets = setify(d.values).filter(e => e.values.length > minSetSize);
      return d;
    })
    .sort((a, b) => b.values.length - a.values.length)
    .reduce((acc, d) => {
      if (d.values.length > maxVal) return acc.concat([d]);
      const last = acc[acc.length - 1];
      last.values = last.values.concat(d.values);
      last.minDate = d3.min(last.values, e => e.date);
      last.maxDate = d3.max(last.values, e => e.date);
      return acc;
    }, [])
    .sort((a, b) => a.minDate - b.minDate);

const chunkData = (docs, limit = 40) =>
  chunkArray(docs, limit)
    .map((a, i) => {
      const minDate = d3.min(a, e => e.date);
      const maxDate = d3.max(a, e => e.date);
      const d = {
        id: i,
        minDate,
        maxDate,
        key: `${minDate} - ${maxDate}`,
        sets: setify(a).filter(e => e.values.length > 1),
        values: a
      };
      return d;
    })
    .sort((a, b) => a.minDate - b.maxDate);

const timelineData = nestByTime(data, d3.timeMonth); // chunkData(data, 40);
const timelineWeekData = nestByTime(data, d3.timeWeek, 1, 0); // chunkData(data, 40);

const sets = setify(data);
const tagCloudSets = setify(data).filter(d => d.values.length > 3);
const setKeys = sets.map(d => d.key);

const tagMapSets = sets.filter(d => d.values.length > 0);

data.forEach((d, i) => {
  const overlap = _.intersection(d.tags, setKeys.slice(0, 200));
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
  timelineWeekData,
  // },
  // tagCloudConf: {
  tagCloudWidth: 800,
  tagCloudHeight: 800,
  tagCloudSets,

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

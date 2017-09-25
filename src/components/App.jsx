// import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom';
import styles from './App.scss';

import rawData from './data/sujets/data.xml';

const realData = rawData.data.sujet;
console.log('realData', realData);

import Layout from './Layout';

class App extends React.Component {
  static propTypes() {
    return {
      path: React.PropTypes.string.isRequired
    };
  }
  constructor(props) {
    super(props);

    const { width, height } = props;

    this.state = {
      width: 1200,
      height: 1000,
      data: realData
    };
  }

  componentDidMount() {}

  // componentWillReceiveProps(props) {
  //   console.log('newProps', props);
  //
  //   this.setState({
  //     path: props.path
  //   });
  // }

  render() {
    const { data, width, height } = this.state;
    console.log('data entry', data);
    return (
      <div className={`container ${styles.main}`}>
        <h1>Platforme DD - Articles </h1>
        <div>
          <Layout data={data} />
        </div>
      </div>
    );
  }
}

App.defaultProps = {
  width: 860,
  height: 640
};

export default App;

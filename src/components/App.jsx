// import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom';
import styles from './App.scss';

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
      width,
      height
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
    return (
      <div className={`container ${styles.mainCont} ${styles.extraMargin}`} />
    );
  }
}

App.defaultProps = {
  width: 860,
  height: 640
};

export default App;

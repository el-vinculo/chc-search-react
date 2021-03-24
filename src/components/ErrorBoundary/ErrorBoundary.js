import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import './ErrorBoundary.scss';

export class ErrorBoundary extends PureComponent {
  constructor(props) {
    super(props);

    const { history } = props;
    history.listen(() => {
      if (this.state.hasError) {
        this.setState({
          hasError: false,
        });
      }
    });

    this.state = { hasError: false };
  }

  componentDidCatch() {
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <section id="not-found">
            <div id="title">
              <button
                type="button"
                className="btn-back"
                // onClick={this.props.history.goBack}
                onClick={() => window.location.reload()}
              >
                Reload page
              </button>
              <h3>Oops! - Something went wrong.</h3>
            </div>
            <div className="error-body">
              <p>Please check back later.</p>
            </div>
          </section>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  history: PropTypes.object,
};

export default withRouter(ErrorBoundary);

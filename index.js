import React, { PureComponent } from "react";
import State from "jstates";

export function subscribe(
  Compt,
  statesToSubscribeTo = [],
  mapStatesToProps = f => f
) {
  if (!Compt) {
    throw new Error(
      "subscribe was called without a component or callback. subscribe(Component | callback, [statesToSubscribeTo], mapStatesToProps)"
    );
  }

  if (statesToSubscribeTo.length < 1) {
    throw new Error(
      "subscribe was called without states to subscribe to. subscribe(Component, [statesToSubscribeTo], mapStatesToProps)"
    );
  }

  return class Subscribe extends PureComponent {
    mounted = true;

    constructor(props) {
      super(props);

      this.onUpdate = this.onUpdate.bind(this);
      statesToSubscribeTo.forEach(state => {
        state.subscribe(this.onUpdate);
      });
      this.state = this.generateState();
      this.keys = Object.keys(this.state);
    }

    generateState() {
      const subscribedStates = {};
      statesToSubscribeTo.forEach(function extractState({
        name,
        state,
        setState
      }) {
        subscribedStates[name] = { state, setState };
      });

      return mapStatesToProps(subscribedStates);
    }

    componentWillUnmount() {
      this.mounted = false;
      statesToSubscribeTo.forEach(state => {
        state.unsubscribe(this.onUpdate);
      });
    }

    onUpdate(keysChanged) {
      return new Promise(resolve => {
        if (this.mounted && keysChanged.find(i => this.keys.indexOf(i) > -1)) {
          this.setState(this.generateState(), resolve);
        } else {
          resolve();
        }
      });
    }

    render() {
      return <Compt {...this.props} {...this.state} />;
    }
  };
}

module.exports = { State, subscribe };
module.exports.State = State;
module.exports.subscribe = subscribe;

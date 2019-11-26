import React, { PureComponent } from "react";
export const State = require("jstates");

export function subscribe(
  Compt,
  statesToSubscribeTo = [],
  mapStatesToProps = f => f,
  stateKeysToListenTo = []
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
    constructor(props) {
      super(props);

      this.mounted = true;
      this.onUpdate = this.onUpdate.bind(this);
      statesToSubscribeTo.forEach(state => {
        state.subscribe(this.onUpdate);
      });
      this.state = this.generateState();
    }

    generateState() {
      const subscribedStates = {};
      statesToSubscribeTo.forEach(function extractState({ name, state }) {
        subscribedStates[name] = state;
      });

      return mapStatesToProps(subscribedStates);
    }

    componentWillUnmount() {
      this.mounted = false;
      statesToSubscribeTo.forEach(state => {
        state.unsubscribe(this.onUpdate);
      });
    }

    onUpdate(keysChanged = []) {
      return new Promise(resolve => {
        if (this.mounted) {
          if (
            !keysChanged.length ||
            (stateKeysToListenTo.length &&
              !stateKeysToListenTo.find(key => keysChanged.indexOf(key) > -1))
          ) {
            resolve();
            return;
          }
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

export default { State, subscribe };

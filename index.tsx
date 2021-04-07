import * as React from "react";
import { PureComponent, useState, useEffect } from "react";
import * as JstatesCreateState from "jstates";
import { JState } from "jstates";

export const createState = JstatesCreateState.default;
export type JstateInstance = ReturnType<typeof createState>;
type CompositeComponent = React.ComponentClass | React.FunctionComponent;

export function subscribe(
  Component: CompositeComponent,
  statesToSubscribeTo: JstateInstance[] | JstateInstance,
  mapStatesToProps = (...states: JState[]) => ({ states })
): typeof PureComponent {
  if (!Component) {
    throw new Error(
      "subscribe was called without a component. subscribe(Component, [statesToSubscribeTo], mapStatesToProps)"
    );
  }

  if (!statesToSubscribeTo) {
    throw new Error(
      "subscribe was called without states to subscribe to. subscribe(Component, [statesToSubscribeTo], mapStatesToProps)"
    );
  }
  const normelizedStatesToSubscribeTo: JstateInstance[] = Array.isArray(
    statesToSubscribeTo
  )
    ? statesToSubscribeTo
    : [statesToSubscribeTo];

  return class Subscribe extends PureComponent {
    mounted = true;
    state = {};

    constructor(props: any) {
      super(props);

      this.onUpdate = this.onUpdate.bind(this);
      normelizedStatesToSubscribeTo.forEach((state) => {
        state.subscribe(this.onUpdate);
      });
      this.state = this.generateState();
    }

    generateState() {
      const states = normelizedStatesToSubscribeTo.map((i) => i.state);
      return mapStatesToProps(...states);
    }

    componentWillUnmount() {
      this.mounted = false;
      normelizedStatesToSubscribeTo.forEach((state) => {
        state.unsubscribe(this.onUpdate);
      });
    }

    onUpdate() {
      return new Promise<void>((resolve) => {
        if (this.mounted) {
          this.setState(this.generateState(), resolve);
        } else {
          resolve();
        }
      });
    }

    render() {
      return <Component {...this.props} {...this.state} />;
    }
  };
}

export const useSubscribe = (stateInstance: JstateInstance) => {
  const [subscribeState, setSubscribeState] = useState(
    stateInstance && stateInstance.state
  );

  useEffect(() => {
    if (!stateInstance) {
      throw new Error(
        "useSubscribe was called without a state. It should be called like this: useSubscribe(stateInstance);"
      );
    }

    const updateState = () => {
      setSubscribeState(stateInstance.state);
    };

    stateInstance.subscribe(updateState);

    return () => {
      stateInstance.unsubscribe(updateState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return subscribeState;
};

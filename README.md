<div align="center">
  <br><br><br><br><br>
  <img src="https://raw.githubusercontent.com/oryoffe/jstates-react/master/jstates.png" alt="jstates Logo" width="400">
  <br><br><br><br><br><br><br><br>
</div>

# JStates for React.js

[The core JStates Library](https://github.com/orYoffe/jstates)

[JStates](https://github.com/orYoffe/jstates) React - A subscribe function to use [JStates](https://github.com/orYoffe/jstates) state library

[codesandbox jstates-react example](https://codesandbox.io/s/jstates-react-93uhx)

[![NPM](https://nodei.co/npm/jstates-react.png)](https://npmjs.org/package/jstates-react)

![GitHub issues](https://img.shields.io/github/issues/orYoffe/jstates-react.svg)
![license](https://img.shields.io/github/license/orYoffe/jstates-react.svg)
![npm bundle size (minified)](https://img.shields.io/bundlephobia/min/jstates-react.svg)
![npm](https://img.shields.io/npm/v/jstates-react.svg)

## Install

```sh
npm i -S jstates-react
```

## Usage

```js
import { createState, subscribe } from "jstates-react";

const state = createState({ counter: 0 });

const addOne = () => state.setState((state) => ({ counter: ++state.counter }));
const removeOne = () =>
  state.setState((state) => ({ counter: --state.counter }));

function Counter() {
  return (
    <div>
      <button onClick={addOne}>add one +</button>
      <button onClick={removeOne}>remove one -</button>
    </div>
  );
}

function App({ states }) {
  return (
    <div>
      <p>Current counter: {states.counter}</p>
      <Counter />
    </div>
  );
}

export default subscribe(App, state);
```

### `subscribe` options

#### Minimal requirement

`subscribe` should be called with a component and a state or an array with at least one jstates state instance.
Then would get updated whatever changes are made to the states it subscribes to

```js
const someState = createState({});

subscribe(Component, someState);

// With multiple states
const someOtherState = createState({});

subscribe(Component, [someState, someOtherState]);
```

#### `mapStatesToProps`

`subscribe` can be called with an additional function to map the states it subscribes to
into the props of the component. This pattern can be seen also in libraries like react-redux and is easy to test

```js
const mapStatesToProps = (counterState, otherState) => ({
  counter: counterState.counter,
  someOtherValue: otherState.someOtherValue,
});

function App({ counter, someOtherValue }) {
  return (
    <div>
      <p>Current counter: {counter}</p>
      <p>Another value: {someOtherValue}</p>
      <Counter />
    </div>
  );
}

subscribe(App, [counterState, otherState], mapStatesToProps);
```

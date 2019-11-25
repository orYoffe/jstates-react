<div align="center">
  <br><br><br><br><br>
  <img src="https://raw.githubusercontent.com/oryoffe/jstates-react/master/jstates.png" alt="jstates Logo" width="400">
  <br><br><br><br><br><br><br><br>
</div>

# JStates for React.js

[The code JStates Library](https://github.com/orYoffe/jstates)

[JStates](https://github.com/orYoffe/jstates) React - A subscribe function to use [JStates](https://github.com/orYoffe/jstates) state library

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
// counterState.js
import { State } from "jstates-react";

const initialState = { counter: 0 };

const counterState = new State("counterState", initialState);

export default counterState;
```

```js
// Counter.js
import React from "react";
import counterState from "./counterState";

const addOne = () => counterState.setState(state => ({ count: ++state.count }));
const removeOne = () => counterState.setState(state => ({ count: --state.count }))

function Counter() {
  return (
    <>
      <p>Counter</p>
      <button onPress={addOne}>
        <p>add one +</p>
      </button>
      <button onPress={removeOne}>
        <p>remove one -</p>
      </button>
    </>
  );
}

export default Counter;
```

```js
// App.js
import React from "react";
import { subscribe } from "jstates-react";
import counterState from "./counterState";
import Counter from "./Counter";

function App({ counter }) {
  return (
    <>
      <p>Current counter: {counter}</p>
      <Counter />
    </>
  );
}

const mapStates = ({ counterState }) => ({
  counter: () => counterState.state.counter
});

export default subscribe(App, [counterState], mapStates);
```

\*\* `subscribe` can also be used without a `mapStates` function.
Then would get updated whatever changes are made to the states it subscribes to

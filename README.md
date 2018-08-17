# Story2frontify

[![Greenkeeper badge](https://badges.greenkeeper.io/britishgas-engineering/story2frontify.svg)](https://greenkeeper.io/)

> This is currently alpha. Not every scenario has been looked into. If you find something, please raise an issue or PR.

## About

Convert your stories inside storybook to frontify's pattern library.

## Installation

This can be installed globally or local to your repo.

Inside project:
```
npm i --save story2frontify
```

Globally:
```
npm i -g story2frontify
```

## Usage

Pass the arguments:

 - token
 - project
 - baseUrl
 - localhost (default: http://localhost:9001/iframe.html)
 - input (if you want to use static storybook instead)

 Examples:

 ```
  s2f --token xxxxxxxxxxxx --project xx --baseUrl https://PROJECT.frontify.com
 ```

 ```
  s2f --token xxxxxxxxxxxx --project xx --baseUrl https://PROJECT.frontify.com --localhost http://localhost:8080/iframe.html
 ```

 ```
  s2f --token xxxxxxxxxxxx --project xx --baseUrl https://PROJECT.frontify.com --input dist/demo/iframe.html
 ```

 ```
  export token='xxxxxxxxxxxxx'
  export project='xx'
  export baseUrl='https://PROJECT.frontify.com'
  s2f
 ```

 ```
  export token='xxxxxxxxxxxxx'
  export project='xx'
  export baseUrl='https://PROJECT.frontify.com'
  s2f --input dist/demo/iframe.html
 ```

## issues

Each story needs to have a `div` wrapper around.

Currently to decide if your stories are an `atom`, `molecules` or `organisms`, you need to have a  a `type` attribute in the first (primary) story.

```
return ('<div type="atom"><button>Click me</button></div>');
```

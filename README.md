mxhr.coffee
===========

A lightweight library for implementing MXHR client-side with JavaScript/CoffeeScript
Based on DUI.Stream <https://github.com/digg/stream>

## Usage

Just include this script. No library is required.

    <script src="mxhr.js"></script>

## Sending a MXHR Request

    mxhr('/api/foo-bar?param=1')

## Binding MIME listeners

Payload will be passed as parameter of the callback function. You can also get access to XHR object inside your callback by `this`.

    mxhr('/api/foo-bar?param=1').listen('application/json', function(payload) {
        console.log('ReadyState: ' + this.readyState);
        console.log('JSON: ' + payload);
    }).listen('text/html', function(payload) {
        console.log('HTML: ' + payload);
    });

## Bind complete event

    mxhr('/api/foo-bar?param=1').complete(function() {
        console.log('Complete');
    });
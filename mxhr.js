/**
 * MXHR.Coffee
 * (c) 2013 Joshua Zhang
 * MIT Licensed.
 *
 * https://github.com/toruta39/mxhr.coffee
 */

(function() {
  (function(window) {
    var mxhr;
    mxhr = function(url) {
      var boundary, closeStream, err, lastLength, listeners, ping, processPacket, stream, timer, xhr;
      timer = null;
      lastLength = 0;
      stream = null;
      listeners = {};
      boundary = '';
      ping = function() {
        var length, packet;
        length = xhr.responseText.length;
        packet = xhr.responseText.substring(lastLength, length);
        lastLength = length;
        processPacket(packet);
      };
      processPacket = function(packet) {
        var chunk, end, payload, start;
        if (!packet.length) {
          return;
        }
        start = packet.indexOf(boundary);
        end = -1;
        if (start > -1) {
          if (stream != null) {
            end = start;
            start = -1;
          } else {
            end = packet.indexOf(boundary, start + boundary.length);
          }
        }
        if (stream != null) {
          if (end > -1) {
            chunk = packet.substring(0, end);
            stream += chunk;
            closeStream();
            processPacket(packet);
          } else {
            stream += packet;
          }
        } else {
          stream = '';
          if (start > -1) {
            if (end > -1) {
              payload = packet.substring(start, end);
              stream += payload;
              packet = packet.replace(payload, '');
              closeStream();
              processPacket(packet);
            } else {
              stream += packet.substr(start);
            }
          } else {

          }
        }
      };
      closeStream = function() {
        var listener, mime, mimeAndPayload, payload, _i, _len, _ref;
        stream = stream.replace("" + boundary + "\n", '');
        mimeAndPayload = stream.split('\n');
        mime = mimeAndPayload.shift().split('Content-Type:', 2)[1].split(';', 1)[0].replace(' ', '');
        if (mime == null) {
          mime = null;
        }
        payload = mimeAndPayload.join('\n');
        if (listeners[mime] != null) {
          _ref = listeners[mime];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            listener = _ref[_i];
            listener.call(xhr, payload);
          }
        }
        stream = null;
      };
      try {
        xhr = new ActiveXObject('MSXML2.XMLHTTP.6.0');
      } catch (_error) {
        err = _error;
        try {
          xhr = new ActiveXObject('MSXML3.XMLHTTP');
        } catch (_error) {
          err = _error;
          try {
            xhr = new XMLHttpRequest();
          } catch (_error) {
            err = _error;
            throw new Error('No supported version of XHR is found');
          }
        }
      }
      xhr.open('GET', url, true);
      xhr.onreadystatechange = function(e) {
        var contentTypeHeader, listener, _i, _len, _ref;
        if (xhr.readyState === 3 && (timer == null)) {
          contentTypeHeader = xhr.getResponseHeader("Content-Type");
          if (contentTypeHeader.indexOf('multipart/mixed') < 0) {
            throw new Error('Response should be sent as multipart/mixed');
          } else {
            boundary = '--' + contentTypeHeader.split('"')[1];
            timer = setInterval(ping, 15);
          }
        } else if (xhr.readyState === 4) {
          clearInterval(timer);
          ping();
          if (typeof listeners.complete === 'function') {
            _ref = listeners.complete;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              listener = _ref[_i];
              listener.call(xhr);
            }
          }
        }
      };
      xhr.send();
      return {
        xhr: xhr,
        listen: function(mime, callback) {
          if (listeners[mime] == null) {
            listeners[mime] = [];
          }
          if (typeof callback === 'function') {
            listeners[mime].push(callback);
          }
          return this;
        },
        complete: function(callback) {
          return this.listen('complete', callback);
        }
      };
    };
    window.mxhr = mxhr;
  })(window);

}).call(this);

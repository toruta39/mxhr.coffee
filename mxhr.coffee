# MXHR.Coffee
# (c) 2013 Joshua Zhang
# MIT Licensed.
#
# https://github.com/toruta39/mxhr.coffee

do (window) ->
    mxhr = (url) ->

        timer = null
        lastLength = 0
        stream = null
        listeners = {}
        boundary = ''

        ping = ->
            length = xhr.responseText.length
            packet = xhr.responseText.substring lastLength, length

            lastLength = length
            processPacket packet
            return

        processPacket = (packet) ->
            return if !packet.length

            start = packet.indexOf boundary
            end = -1

            if start > -1
                # boundary found
                if stream?
                    # if stream exists, it will be an end boundary
                    end = start
                    start = -1
                else
                    # start boundary found, check if end boundary exists
                    end = packet.indexOf boundary, start + boundary.length

            if stream?
                if end > -1
                    chunk = packet.substring 0, end
                    stream += chunk
                    closeStream()
                    processPacket packet
                else
                    stream += packet
            else
                stream = ''
                if start > -1
                    if end > -1
                        payload = packet.substring start, end
                        stream += payload

                        packet = packet.replace payload, ''

                        closeStream()

                        processPacket packet
                    else
                        stream += packet.substr start
                else
                    # Do nothing

            return

        closeStream = ->
            stream = stream.replace "#{boundary}\n", ''

            mimeAndPayload = stream.split '\n'

            # To grab mime string
            #
            # 1. Take out the first line
            # 2. Get string after content-type
            # 3. Cut off unnecessary tail
            # 4. Trim

            mime = mimeAndPayload.shift().split('Content-Type:', 2)[1].split(';', 1)[0].replace(' ', '')

            mime ?= null

            payload = mimeAndPayload.join '\n'

            if listeners[mime]?
                for listener in listeners[mime]
                    listener.call xhr, payload

            stream = null
            return

        # Since jqXHR doesn't provide onreadystatechange mechanism,
        # a native XHR object is needed.
        try
            xhr = new ActiveXObject 'MSXML2.XMLHTTP.6.0'
        catch err
            try
                xhr = new ActiveXObject 'MSXML3.XMLHTTP'
            catch err
                try
                    xhr = new XMLHttpRequest()
                catch err
                    throw new Error 'No supported version of XHR is found'

        xhr.open 'GET', url, true

        xhr.onreadystatechange = (e) ->
            # Check readystate and response
            if xhr.readyState is 3 and !timer?
                contentTypeHeader = xhr.getResponseHeader "Content-Type"
                if contentTypeHeader.indexOf('multipart/mixed') < 0
                    throw new Error 'Response should be sent as multipart/mixed'
                else
                    boundary = '--' + contentTypeHeader.split('"')[1]
                    timer = setInterval ping, 15
            else if xhr.readyState is 4
                clearInterval timer
                ping()
                if typeof listeners.complete is 'function'
                    for listener in listeners.complete
                        listener.call xhr

            return

        xhr.send()

        return {
            xhr: xhr
            listen: (mime, callback) ->
                listeners[mime] ?= []
                listeners[mime].push callback if typeof callback is 'function'
                return @
            complete: (callback) -> @listen 'complete', callback
            abort: ->
                clearInterval timer
                ping()
                xhr.abort()
                return
        }

    window.mxhr = mxhr
    return

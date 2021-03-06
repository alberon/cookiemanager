# Cookie Manager
by Dave Miller, [Alberon Ltd](http://www.alberon.co.uk/).

Copyright © Alberon Ltd 2012. Released under the MIT License.

## Basic usage

```js
CookieManager.add({
    // A name to identify this type of cookie
    name:                    'analytics',

    // Run immediately if the user has opted in
    if_opted_in:             function() {},

    // Run immediately if the user has opted out
    if_opted_out:            function() {},

    // Run immediately if the user hasn't made a choice
    if_unknown:              function() {},

    // Run at DOM ready if the user has opted in (requires jQuery)
    at_ready_if_opted_in:    function() {},

    // Run at DOM ready if the user has opted out (requires jQuery)
    at_ready_if_opted_out:   function() {},

    // Run at DOM ready if the user hasn't made a choice (requires jQuery)
    at_ready_if_unknown:     function() {},

    // Run when the user changes status to opt in
    at_opt_in:               function() {},

    // Run when the user changes status to opt out
    at_opt_out:              function() {},

    // Run when the user clears their cookies
    at_reset:                function() {},
});
```

`name` is required. All event handlers (methods) are optional.

Different handlers should have different names if the user can opt in/out of
them separately. Alternatively you can add multiple handlers with the same
name and they will be linked together - i.e. events will be run on all
handlers with the same name (in the order they are added).

You can provide a string instead of a function and the method with that name
will be run instead. For example:

```js
CookieManager.add({
    name:            'sample',

    // This is a custom method called run()
    run:             function() {},

    // The run() method will be called immediately if the user is opted in
    if_opted_in:     'run',

    // The same run() method will be called when the user opts in
    at_opt_in:       'run',

    // You can use an array to attach multiple event handlers, e.g.
    at_opt_out:      ['delete_cookies', 'show_warning_bar']
});
```

Within the event handlers above (and custom methods) you can call:
- `this.get_status()` - returns 'accept', 'block' or 'unknown'
- `this.opt_in()` - set status to 'accept'
- `this.opt_out()` - set status to 'block'
- `this.reset()` - set status to 'unknown' (delete setting)

Note: Because of this you should not create any custom method with these
names.

You can also call these methods directly, passing in the name:

- `CookieManager.get_status(name)`
- `CookieManager.opt_in(name)`
- `CookieManager.opt_out(name)`
- `CookieManager.reset(name)`

These is also a method to reset all known settings at once:

- `CookieManager.reset_all()`

Some helper methods for working with cookies are available:

- `CookieManager.get_cookie(name, defaultValue)`
- `CookieManager.set_cookie(name, value, expires, path, domain, secure)`
- `CookieManager.delete_cookie(name, path, domain, secure)`

The following config options can be set *after* loading this file but
*before* calling any methods:

- `CookieManager.cookie_name = 'cookieName';` (Default: `CookieManager`)
- `CookieManager.cookie_days = 730;` (Default: 2 years)
- `CookieManager.cookie_path = '/siteroot/;` (Default: `/`)
- `CookieManager.cookie_domain = '.mysite.com';` (Default: current subdomain only)
- `CookieManager.cookie_secure = true;` (Default: `false`)

Note: Only one cookie is used for all handlers. They are concatenated in
the format 'handler1=allow,handler2=block', where 'handler1' is the 'name'
property specified when adding the handler.

## Example: Google Analytics
```js
// Google Analytics
var ga = CookieManager.add({

    name: 'ga',

    // Run the tracking code (once only)
    has_run: false,
    run: function() {
        if (!this.has_run) {
            window._gaq = window._gaq || [];
            _gaq.push(['_setAccount', 'UA-XXXXXXXX-X']);
            _gaq.push(['_trackPageview']);

            var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
            ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);

            this.has_run = true;
        }
    },

    // If the user opts out, delete all Google Analytics cookies
    delete_cookies: function() {
        var domain = document.location.hostname;
        domain = '.' + domain.replace(/^www\./, '');
        CookieManager.delete_cookie('__utma', '/', domain);
        CookieManager.delete_cookie('__utmb', '/', domain);
        CookieManager.delete_cookie('__utmc', '/', domain);
        CookieManager.delete_cookie('__utmv', '/', domain);
        CookieManager.delete_cookie('__utmz', '/', domain);
    },

    // Event handlers
    if_opted_in: 'run',
    //if_unknown: 'run', // Implied consent?
    at_opt_in: 'run',
    at_opt_out: 'delete_cookies'
});
```

(Note that the CookieManager.add() method returns a `CookieManagerHandler`
instance that includes the methods listed above (`get_status()`, `opt_in()`,
`opt_out()`, `reset()`), as well as your custom methods/properties.)

Then you would build a UI that uses these method calls to get/set the status:

- `ga.get_status()` (returns `accept`, `block` or `unknown`)
- `ga.opt_in()`
- `ga.opt_out()`

Or you can call these functions directly on `CookieManager`:

- `CookieManager.get_status('ga')` (returns `accept`, `block` or `unknown`)
- `CookieManager.opt_in('ga')`
- `CookieManager.opt_out('ga')`

Or you could build the GUI functionality into the same object.

Or you could have a separate instance with the same name, to keep them
independent. (Note that the event handlers for *all* instances with the same
name are called, no matter which one you are working with.)

## Advanced usage

You can register an event handler to be notified when the user changes the
status for any cookie handler:

```js
CookieManager.subscribe('set_status', function(name, status) { ... });
```

You can also create a CookieManagerHandler instance manually if you want and
pass that to `CookieManager.add()` instead of a plain object.

```js
var handler = new CookieManagerHandler(settings);
CookieManager.add(handler);
```

## Developer notes

The following properties & methods are for internal use only:

- `CookieManager.handlers` - An array holding all the handlers
- `CookieManager.get_statuses()` - Returns an object of statuses, e.g. `{handler1: 'allow'}`
- `CookieManager.run(handler, methodName)` - Run the named method on the given handler object (if possible)
- `CookieManager.runAll(name, methodName)` - Run the named method on all handlers with the given name

## MIT License
Copyright © Alberon Ltd. 2012

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Change log
### v1.2.1
- Remove for..in loop, for [MooTools compatibility](http://stackoverflow.com/questions/2040042/javascript-array-iteration-using-for-in-with-mootools-included).

### v1.2
- Allow path, domain and secure flag to be changed in config.
- Set cookies for the entire site by default (i.e. path = `/`).

### v1.1.1
- First public release - added a README.

### v1.1
- Added the ability to have an array of handlers.

### v1.0
- Initial internal release.

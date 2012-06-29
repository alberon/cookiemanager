// Version 1.1.1
// Copyright Alberon Ltd. 2012
// MIT License
(function() {

    // Create a global CookieManager namespace
    window.CookieManager = {}

    // The cookie name can be changed if necessary
    CookieManager.cookie_name = "CookieManager";

    // The length of time the cookie will be stored for
    CookieManager.cookie_days = 730; // 2 years

    // General cookie functions
    CookieManager.get_cookie = function(name, defaultValue) {
        // Source: http://www.quirksmode.org/js/cookies.html
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0)
                return unescape(c.substring(nameEQ.length, c.length));
        }
        return (defaultValue || null);
    }

    CookieManager.set_cookie = function(name, value, expires, path, domain, secure) {
        if (path === null) {
            path = "/";
        }

        // Source: http://techpatterns.com/downloads/javascript_cookies.php
        // set time, it's in milliseconds
        var today = new Date();
        today.setTime(today.getTime());

        /*
        if the expires variable is set, make the correct
        expires time, the current script below will set
        it for x number of days, to make it for hours,
        delete * 24, for minutes, delete * 60 * 24
        */
        if (expires) {
            expires = expires * 1000 * 60 * 60 * 24;
        }
        var expires_date = new Date(today.getTime() + (expires));

        document.cookie =
        name + "=" + escape(value) +
        ((expires) ? ";expires=" + expires_date.toGMTString() : "") +
        ((path) ? ";path=" + path : "") +
        ((domain) ? ";domain=" + domain : "") +
        ((secure) ? ";secure" : "");
    }

    CookieManager.delete_cookie = function(name, path, domain, secure) {
        CookieManager.set_cookie(name, "", -1, path, domain, secure);
    }

    // Get all the known cookie statuses as an object
    CookieManager.get_statuses = function() {
        var obj = {};
        var cookie = CookieManager.get_cookie(CookieManager.cookie_name);
        if (cookie) {
            cookie = cookie.split(",");
            for (var i = 0; i < cookie.length; i++) {
                var parts = cookie[i].split("=");
                if (parts.length == 2) {
                    obj[parts[0]] = parts[1];
                }
            }
        }
        return obj;
    }

    // Get the current status for a given cookie ("allow", "block" or "unknown")
    CookieManager.get_status = function(name) {
        var statuses = CookieManager.get_statuses()
        if (statuses[name]) {
            return statuses[name];
        } else {
            return "unknown";
        }
    }

    // Set the status for a given cookie
    CookieManager.set_status = function(name, value) {
        var statuses = CookieManager.get_statuses()

        // Set the new value (or remove if it's being set to "unknown")
        if (!value || value == "unknown") {
            delete statuses[name];
        } else {
            statuses[name] = value;
        }

        // Build up an array of values
        var parts = [];
        for (var i in statuses) {
            parts.push(i + "=" + statuses[i]);
        }

        // Set or delete the cookie
        if (parts.length > 0) {
            CookieManager.set_cookie(CookieManager.cookie_name, parts.join(","), CookieManager.cookie_days);
        } else {
            CookieManager.delete_cookie(CookieManager.cookie_name);
        }

        // Notify any event handlers
        CookieManager.notify("set_status", name, value);
    }

    // All the handlers that have been added
    CookieManager.handlers = []

    // Add a new cookie blocker
    CookieManager.add = function(handler) {
        // If a plain object is given, convert it to a CookieManagerHandler
        if (!(handler instanceof CookieManagerHandler)) {
            handler = new CookieManagerHandler(handler);
        }

        // Keep a reference to the code for use if the status changes
        CookieManager.handlers.push(handler);

        // Run the appropriate code immediately
        var status = CookieManager.get_status(handler.name);
        if (status == "allow") {
            CookieManager.run(handler, "if_opted_in");
        } else if (status == "block") {
            CookieManager.run(handler, "if_opted_out");
        } else {
            CookieManager.run(handler, "if_unknown");
        }

        // Run the appropriate code when the document is ready (require jQuery)
        if (jQuery) {
            jQuery(document).ready(function() {
                CookieManager.run(handler, "at_ready");
                if (status == "allow") {
                    CookieManager.run(handler, "at_ready_if_opted_in");
                } else if (status == "block") {
                    CookieManager.run(handler, "at_ready_if_opted_out");
                } else {
                    CookieManager.run(handler, "at_ready_if_unknown");
                }
            });
        }

        // Return the CookieManagerHandler object in case the user wants a reference
        // to it
        return handler;
    }

    // Run a particular method for a given cookie blocker, if it exists
    CookieManager.run = function(handler, methodName) {
        if (handler[methodName]) {
            if (typeof handler[methodName] == "object") {
                for (i in handler[methodName]) {
                    if (typeof handler[methodName][i] == "string") {
                        CookieManager.run(handler, handler[methodName][i]);
                    } else {
                        handler[methodName][i]()
                    }
                }
            } else if (typeof handler[methodName] == "string") {
                // If it's a string, treat it as a pointer to another named function
                // e.g. {run: function() {...}, at_opt_in: "run"}
                CookieManager.run(handler, handler[methodName]);
            } else {
                handler[methodName]()
            }
        }
    }

    // Run a particular method for all cookie blockers with a given name
    CookieManager.runAll = function(name, methodName) {
        for (var i = 0; i < CookieManager.handlers.length; i++) {
            if (CookieManager.handlers[i].name == name) {
                CookieManager.run(CookieManager.handlers[i], methodName);
            }
        }
    }

    // Opt in
    CookieManager.opt_in = function(name) {
        CookieManager.set_status(name, "allow");
        CookieManager.runAll(name, "at_opt_in");
    }

    // Opt out
    CookieManager.opt_out = function(name) {
        CookieManager.set_status(name, "block");
        CookieManager.runAll(name, "at_opt_out");
    }

    // Reset settings
    CookieManager.reset = function(name) {
        CookieManager.set_status(name, "unknown");
        CookieManager.runAll(name, "at_reset");
    }

    // Reset all known settings
    CookieManager.reset_all = function() {
        var statuses = CookieManager.get_statuses();
        for (i in statuses) {
            CookieManager.reset(i);
        }
    }

    // Allow user code to be notified whenever something changes
    CookieManager.subscribed = {}

    CookieManager.subscribe = function(evt, fn) {
        if (!CookieManager.subscribed[evt]) {
            CookieManager.subscribed[evt] = [];
        }
        CookieManager.subscribed[evt].push(fn);
    }

    CookieManager.notify = function(evt) {
        if (CookieManager.subscribed[evt]) {
            var args = Array.prototype.slice.call(arguments, 1);
            for (var i in CookieManager.subscribed[evt]) {
                CookieManager.subscribed[evt][i].apply(null, args);
            }
        }
    }

    // Create a prototype (class) for each handler to use
    window.CookieManagerHandler = function(methods) {
        // Copy all the methods (and variables) from the given object
        if (methods) {
            for (var i in methods) {
                this[i] = methods[i];
            }
        }
    }

    // Default settings
    CookieManagerHandler.prototype.name = "default";

    // Helper methods
    CookieManagerHandler.prototype.get_status = function() {
        CookieManager.get_status(this.name);
    }

    CookieManagerHandler.prototype.opt_in = function() {
        CookieManager.opt_in(this.name);
    }

    CookieManagerHandler.prototype.opt_out = function() {
        CookieManager.opt_out(this.name);
    }

    CookieManagerHandler.prototype.reset = function() {
        CookieManager.reset(this.name);
    }

} ());

/*
 *  Copyright 2013 Darren Schnare
 *  Licensed under the MIT License, (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://opensource.org/licenses/MIT
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
(function (global) {
  var factory, util;

  /// Module Factory ///

  factory = function (mustache) {
    mustache.util = util;
    helpers = {};

    /// Overriding ///
    
    mustache.Context._stack = [];
    mustache.Context.withView = function (view) {
      var i, len;
      for (i = 0, len = this._stack.length; i < len; i += 1) {
        if (this._stack[i].view === view) return this._stack[i];
      }      
    };
    mustache.Context.make = util.override(mustache.Context.make, function (base, view) {
      var ctx = base.call(this, view);
      if (ctx !== view) {
        this._stack.push(ctx);
      }
      return ctx;
    var helpers;

    if (!mustache) throw new Error('Mustache does not exist.');
    });    
    mustache.Context.prototype.push = util.override(mustache.Context.prototype.push, function (base, view) {      
      var ctx = base.call(this, view);
      mustache.Context._stack.push(ctx);
      return ctx;
    });  

    // :numbers = move down the stack one level
    // ::numbers = move down the stack two levels
    // !numbers = move to the bottom of the stack
    mustache.Context.prototype.lookup = util.override(mustache.Context.prototype.lookup, function (base, path) {      
      var c = this, v;

      if (path.charAt(0) === '~') {
        path = path.substr(1);         
        while (c.parent) {
          c = c.parent;
        }        
        if (c !== this) {
          v = c.lookup(path);
        }
      } else if (path.charAt(0) === ':') { 
        while (path.charAt(0) === ':') {          
          path = path.substr(1); 
          if (c.parent) {
            c = c.parent;
          }
        }
        if (c !== this) {
          v = c.lookup(path);
        } else {
          v = base.call(this, path);
        }
      } else {
        v = base.call(this, path);
      }    

      return v;
    });

    // Override Writer.prototype.compile so we can transform the template before mustache
    // has a chance to compile it. We transform all sections of the form from:
    //
    // {{#name arguments}}body{{/name}}
    // to
    // {{#name}}arguments;body{{/name}}
    //
    // We do this transformation so that the section helper API can read the arugments from the section text.
    //
    // Then we override the render function so that we add the helpers to the context.
    mustache.Writer.prototype.compile = util.override(mustache.Writer.prototype.compile, function (base, template, tags) {
      var re, t0, t1, t, fn;
      
      tags = tags || mustache.tags;
      t = util.escapeRegExp(tags[1].charAt(0));
      t0 = util.escapeRegExp(tags[0]);
      t1 = util.escapeRegExp(tags[1]);
      // {{#valueHead valueTail}}
      re = '(' + t0 + '\\s*(?:#|^))\\s*([_$\\-0-9a-z\\.]+)((?:\\s+[^' + t + ']+)+)(' + t1 + ')';
      re = new RegExp(re, 'gi');

      template = template.replace(re, function ($0, head, valueHead, valueTail, tail, index) {        
        return head + valueHead + tail + util.trim(valueTail) + ';'
      });      

      fn = base.call(this, template, tags);

      return function (view, partials) {
        var ctx, result;
        
        if (view instanceof mustache.Context) {
          view.view = util.mixin(util.create(view.view), helpers);
        } else {
          view = util.mixin(util.create(view), helpers);
        }
        
        result = fn(view, partials);

        return result;
      };
    });  
  
    /// Extension ///

    mustache.getHelper = function (name) {
      return helpers[name];
    };

    mustache.registerHelper = function (name, helper) {
      helpers[name] = function () {
        return function (text, render) {
          var match, cmd, result;

          match = /^(.+?);/.exec(text);

          if (match) {            
            cmd = util.trim(match[1]);
            text = util.trim(text.substr(match[0].length));
            result = helper.call(this, cmd, text, render);
          } else {
            result = helper.call(this, '', text, render);
          }               

          return result;
        };
      };
    };
    
    mustache.aliasHelper = function (name, alias) {
      helpers[name] = function () {
        return helpers[alias];
      };
    };  

    /// Builtin Helpers ///

    // Example: {{#with options}}
    mustache.registerHelper('with', function (propertyName, text, render) {
      var ctx, parts, property, value, result;

      if (!propertyName) return render(text);

      result = '';
      ctx = mustache.Context.withView(this);
      property = ctx.lookup(propertyName);

      if (property === undefined || property === null) {
        result = '';
      } else {
        result = mustache.render(text, ctx.push(util.mixin(util.create(property), {"@value": property})));
      }      

      return result;
    });

    // Example: {{#each options}}
    // Example: {{#each people}}
    mustache.registerHelper('each', function (propertyName, text, render) {
      var ctx, parts, property, value, result;

      if (!propertyName) return render(text);

      result = '';      
      ctx = mustache.Context.withView(this);
      property = ctx.lookup(propertyName);     

      if (property === undefined || property === null) {
        result = '';
      } else if (util.isArray(property)) {       
        (function () {
          var i, len, v, view;       

          for (i = 0, len = property.length; i < len; i += 1) {
            v = property[i];
            if (v === undefined || v === null) continue;
            view = ctx.push(util.mixin(util.create(v), {'@index': i, '@key': i, '@value': v}));
            result += mustache.render(text, view);         
          }
        }());
      } else {
        (function () {
          var k, v, view;

          for (k in property) {
            v = property[k];
            if (v === undefined || v === null) continue;
            view = ctx.push(util.mixin(util.create(v), {'@index': k, '@key': k, '@value': v}));
            result += mustache.render(text, view);
          }
        }());
      }    

      return result;
    });

    // Example: {{#if members.length > 0}}
    mustache.registerHelper('if', function (expression, text, render) {
      var view, ctx;

      if (!expression) return render(text);

      view = this;
      ctx = mustache.Context.withView(this);
      if (/\w+\s*\(.*\)/.test(expression)) throw new Error('Conditional expressions cannot contain function calls.');
      if (/\[|\]/.test(expression)) throw new Error('Conditional expressions cannot contain square brackets.');
      if (/\{|\}/.test(expression)) throw new Error('Conditional expressions cannot contain curly braces.');
      if (/\b=\b|\+\+|\-\-|\+=|\-=|\*=|\/=|\|=|&=/.test(expression)) throw new Error('Conditional expressions cannot contain assignment expressions.');
      expression = expression.replace(/[@_$a-z][_$a-z0-9]*(?:\.[_$a-z][_$a-z0-9]*)*/ig, function ($0) {
        return 'lookup("' + $0 + '")';
      });      

      try {
        with (ctx) { condition = eval(expression); }
      } catch (error) {   
        condition = false;
      }
      
      if (condition) {
        return render(text);
      }
    });

    // Example: {{#unless members.length === 0}}
    mustache.registerHelper('unless', function (expression, text, render) {
      var view, ctx;

      if (!expression) return render(text);

      view = this;
      ctx = mustache.Context.withView(this);
      if (/\w+\s*\(.*\)/.test(expression)) throw new Error('Conditional expressions cannot contain function calls.');
      if (/\[|\]/.test(expression)) throw new Error('Conditional expressions cannot contain square brackets.');
      if (/\{|\}/.test(expression)) throw new Error('Conditional expressions cannot contain curly braces.');
      if (/\b=\b|\+\+|\-\-|\+=|\-=|\*=|\/=|\|=|&=/.test(expression)) throw new Error('Conditional expressions cannot contain assignment expressions.');
      expression = expression.replace(/[@_$a-z][_$a-z0-9]*(?:\.[_$a-z][_$a-z0-9]*)*/ig, function ($0) {
        return 'lookup("' + $0 + '")';
      });

      try {
        with (ctx) { condition = eval(expression); }
      } catch (error) {        
        condition = false;
      }

      if (!condition) {
        return render(text);
      }
    });

    return mustache;
  };

  /// Utility Functions ///

  util = (function () {
    return {
      isArray: function (o) {
        return Object.prototype.toString.call(o) === '[object Array]';
      },
      override: function (base, fn) {        
        return function () {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(base);
          return fn.apply(this, args);
        };
      },
      create: function (o) {
        var F = function () {};        

        if (o === undefined || o === null) o = {};    

        // o is a literal. 
        if (/string|number|boolean/.test(typeof o)) {
          o = (function (v) {
            return {
              toString: function () { return v + ''; }
            };
          }(o));
        }        
        
        F.prototype = o;
        o = new F();
        o.constructor = F;

        return o;
      },
      mixin: function (o) {
        var i, len, args, arg, k;

        args = ([]).slice.call(arguments, 1);
        for (i = 0, len = args.length; i < len; i += 1) {
          arg = args[i];

          if (arg === 'constructor') continue;

          for (k in arg) {
            if (arg.hasOwnProperty(k)) {
              o[k] = arg[k];
            }
          }
        }

        return o;
      },
      trim: function (s) {
        if (typeof s.trime === 'function') return s.trim();
        return s.replace(/^\s+|\s$/g, '');
      },
      escapeRegExp: function (s) {
        return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      }
    };
  }());

  /// Export ///

  (function () {
    var o;

    if (typeof define === 'function' && define.amd && typeof define.amd === 'object') {
      define(['mustache'], factory);
    } else if (typeof exports !== 'undefined' && exports !== null) {
      o = factory(require('mustache'));
      if (typeof module !== 'undefined' && module !== null && module.exports) {
        module.exports = o;
      }
      exports.Mustache = o;
    } else {
      global.Mustache = factory(global.Mustache);
    }
  }());

}(this));
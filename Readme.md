# Overview

Mustache++ is a natural extension to Mustache.js that adds capabilities similar to Handlebars.js while maintaining full compatibility with the Mustache specification.

The need for such an extension arose when I had a need for a) accessing properties higher in the context (i.e. at the root) and b) iterating over the keys of an object and being able to access the key name and value of said key. Naturally I thought Handlebars.js would be a great fit and solve my problem, this didn't turn out to be the case. Handlebars.js only half solved iterating over the keys of an object and the concept of context in Handlebars.js does not follow the Mustache specification so you can't access properties higher in the context. Mustache++ solves these issues and does it in about 330 lines of code to boot.

# Usage

First thing's first, learn [Mustache](http://mustache.github.com/mustache.5.html). Mustache is a simple yet powerful logic-less templating syntax. Since Mustache++ is a superset of Mustache all techniques and knowledage transfer to Mustache++ one-to-one.

Next, learn the extensions. Mustache++ provides several extensions to Mustache in a way that maintains 100% backward compatability.

## Decendant and Root Context

You can prefix your property paths with `:` to move down one context.
  
*the template*

    {{#father.son}}
      {{#friend}}
        <p>{{:name}}'s friend is {{name}}</p>
      {{/friend}}
    {{/father.son}}

*the view*

    {
      father: {
        name: 'Raymond',
        son: {
          name: 'Eric',
          friend: {
            name: 'Alex'
          }
        }
      }
    }

*the output*

    <p>Eric's friend is Alex</p>


Having more than one `:` character will move that many contexts down the context stack.

*the template*

    {{#father}}
      {{#son}}
        {{#friend}}
          <p>{{:name}}'s friend is {{name}} and his father is {{::name}}</p>
        {{/friend}}
      {{/son}}
    {{/father}}

*the view*

    {
      father: {
        name: 'Raymond',
        son: {
          name: 'Eric',
          friend: {
            name: 'Alex'
          }
        }
      }
    }

*the output*

    <p>Eric's friend is Alex and his father is Raymond</p>

Prefixing your property path with `~` will move down to the root context.

*the template*

    {{#father}}
      {{#son}}
        {{#friend}}
          <p>{{:name}}'s friend is {{name}} and his father is {{~name}}</p>
        {{/friend}}
      {{/son}}
    {{/father}}

*the view*

    {
      father: {
        name: 'Raymond',
        son: {
          name: 'Eric',
          friend: {
            name: 'Alex'
          }
        }
      }
    }

*the output*

    <p>Eric's friend is Alex and his father is Raymond</p>



## Section Helpers

Similar to Handlebars.js block helpers, section helpers offer a way for you to add additional functionality to your Mustache templates.

### {{#with path}}

The `#with` will render its section text in the context of the specified path.

*the template*

    {{#with options}}
      The mode is {{mode}}.
    {{/with}}

*the view*

    {
      options: {
        mode: "prod"
      }
    }

*the output*

    The mode is prod.

Note that the `#with` section will not iterate over the items of an `Array` if its path specifies an `Array`.

*the template*

    {{#with array}}
      The result: {{.}}
    {{/with}}

*the view*

    {
      numbers: [1, 2, 3, 4, 5]
    }

*the output*

    The result: 1,2,3,4,5



### {{#each path}}

The `#each` helper will iterate over the items in an `Array` or the keys in an object and render its section text for each value, similar to normal Mustache sections. Each value rendered will be pushed onto the context stack as usual.

For convenience several `private` properties are available when rendering a value they are `@index`, `@key` and `@value`. The `@index` and `@key` are set to the same value, that being the index or key currently being visited. The `@value` property is set to the value currently being rendered. The `@value` property can be used in place of `{{.}}` or to construct more explicit paths like `{{@value.someprop}}` instead of `{{someprop}}`.

*the template*

    {{#each numbers}}{{@index}}:{{.}} {{/each}}

*the view*

    {
      numbers: [1, 2, 3, 4, 5]
    }

*the output*

    0:1 1:2 2:3 3:4 4:5 

Here's an example of iterating over the keys of an object.

*the template*

    {{#each options}}{{@key}}="{{@value}}"\n{{/each}}

*the view*

    {
      options: {
        mode: "debug",
        margins: "10px 15px 5px 5px"
      }
    }

*the output*

    mode="debug"
    margins="10px 15px 5px 5px"



### {{#if expression}}

The `#if` helper will render its section text only if its expression is truthy. An expression has the following restrictions:

- Cannot contain the following characters: `[]{}`
- Cannot contain assignment statements: = += -= *= /= |= &= ++ --
- Cannot contain functino calls: identifier() identifier(args)

*the template*

    {{#if numbers.length}}
      <h1>Numbers</h1>
      {{#each numbers}}{{@value}} {{/each}}    
    {{/if}}

    {{#if numbers.length > 0}}
      <h2>Numbers</h2>
      {{#each numbers}}{{@value}} {{/each}}    
    {{/if}}

*the view*

    {
      numbers: [1, 2, 3, 4, 5]
    }

*the output*

    <h1>Numbers</h1>
    1 2 3 4 5

    <h2>Numbers</h2>
    1 2 3 4 5



### {{#unless expression}}

The `#unless` helper will render its section text only if its expression is falsy. An expression has the following restrictions:

- Cannot contain the following characters: `[]{}`
- Cannot contain assignment statements: = += -= *= /= |= &= ++ --
- Cannot contain functino calls: identifier() identifier(args)

*the template*

    {{#unless numbers.length === 0}}
      <h1>Numbers</h1>
      {{#each numbers}}{{@value}} {{/each}} 
    {{/unless}}

    {{#unless numbers.length < 0}}
      <h2>Numbers</h2>
      {{#each numbers}}{{@value}} {{/each}} 
    {{/unless}}

*the view*

    {
      numbers: [1, 2, 3, 4, 5]
    }

*the output*

    <h1>Numbers</h1>
    1 2 3 4 5

    <h2>Numbers</h2>
    1 2 3 4 5


# API

**NOTE: Mustache++ will update the existing `Mustache` object in-place. This means the global `Mustache` variable will have the following extensions added to it.**


**Mustache.Context.withView()**

Retrieves the context in the context stack that has the specified view. Ueses strict equality during the comparison.

    withView(view):Context

    view - The view to search for.

**Mustache.registerHelper()**

Registers a section helper with the specified name.

    registerHelper(name, helper)

    name - The name of the helper.
    helper - The function to register as the helper.

Where `helper` is a function with the following signature:

    function (expression, text, render):string

    expression - The text that appears after the helper name in the Mustache token (i.e. `{{#helperName expression}}`).
    text - The section text.
    render - A render function that is bound to the current context that can be passed text to render.

**Mustache.aliasHelper()**

Creates an alias for a helper, making the helper available under multiple names. The helper being aliased does not have to exist before aliasing.

    aliasHelper(name, alias)

**Mustache.getHelper()**

Retrieves a helper with the specified name.

    getHelper(name):function

**Mustache.util.isArray()**

Determines if an object is an `Array`.

    isArray(o):Boolean

**Mustache.util.override()**

Convenience function used to override a function.

    override(base, fn):function

    base - The base version of the function to override.
    fn - The new function.
    return - The new function.

Where `fn` is the new function with the following signature:

    function (base, ...)

    base - The base version of the function being overriden.
    ... - The arguments passed to the function when called.

Example:  

    var o = {
      message: function () {
        return 'hello';
      }
    };
    o.message = Mustache.util.override(o.message, function (base) {
      return base.call(this) + ' world!';
    });
    // hello world!
    o.message();

**Mustache.util.create()**

Creates a new object with the specified object as its prototype. This function accepts literal values such as numbers, booleans, and strings.

    create(o):Object

**Mustache.util.mixin()**

Adds the properties of each argument passed after the first argument to the first arguemnt.

    mixin(o, ...):any

    o - The object to receive the mixin operation.
    ... - The objects to have their properties copied.

**Mustache.util.trim()**

Trims the leading and trailing whitespace from a string.

    trim(s):string

**Mustache.util.escapeRegExp()**

Escapes the regular expression characters in a string.

    escapeRegExp(s):string